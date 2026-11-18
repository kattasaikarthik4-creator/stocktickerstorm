import Redis from 'ioredis';

/**
 * TickerStorm Redis Hot State & Stream Layer
 * 
 * Supports:
 * - Redis Hashes (`price:<symbol>`)
 * - Redis Sorted Sets (`rank:gainers`, `rank:losers`)
 * - Redis Streams (`prices:events`, `alerts:events`)
 * - Atomic Alert Evaluation via Redis Lua Script
 * - Seamless Fallback to Embedded In-Memory Engine if standalone Redis is offline
 */

// Redis Lua script to atomically evaluate threshold crossings
// Evaluates condition and only emits an alert event if it newly crossed threshold
export const ALERT_LUA_SCRIPT = `
  local alertKey = KEYS[1]
  local streamKey = KEYS[2]
  local currentPrice = tonumber(ARGV[1])
  local timestamp = ARGV[2]

  local alertData = redis.call('HMGET', alertKey, 'symbol', 'condition', 'targetPrice', 'isTriggered', 'userId')
  if not alertData[1] then
    return 0
  end

  local symbol = alertData[1]
  local condition = alertData[2]
  local targetPrice = tonumber(alertData[3])
  local isTriggered = tonumber(alertData[4] or '0')
  local userId = alertData[5] or 'user_default'

  local triggeredNow = 0
  if isTriggered == 0 then
    if condition == 'ABOVE' and currentPrice >= targetPrice then
      triggeredNow = 1
    elseif condition == 'BELOW' and currentPrice <= targetPrice then
      triggeredNow = 1
    end
  end

  if triggeredNow == 1 then
    redis.call('HSET', alertKey, 'isTriggered', '1', 'triggeredAt', timestamp)
    local eventId = redis.call('XADD', streamKey, '*', 
      'alertKey', alertKey,
      'symbol', symbol,
      'condition', condition,
      'targetPrice', tostring(targetPrice),
      'currentPrice', tostring(currentPrice),
      'userId', userId,
      'timestamp', timestamp
    )
    return {1, eventId, symbol, condition, targetPrice, currentPrice, userId, timestamp}
  end

  return {0}
`;

class InMemoryRedisMock {
  constructor() {
    this.hashes = new Map(); // key -> Map<field, value>
    this.sortedSets = new Map(); // key -> Map<member, score>
    this.streams = new Map(); // key -> Array<{ id, data }>
    this.streamListeners = new Map(); // key -> Set<callback>
  }

  async hset(key, ...args) {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, new Map());
    }
    const map = this.hashes.get(key);
    if (args.length === 1 && typeof args[0] === 'object') {
      for (const [k, v] of Object.entries(args[0])) {
        map.set(k, String(v));
      }
    } else {
      for (let i = 0; i < args.length; i += 2) {
        map.set(args[i], String(args[i + 1]));
      }
    }
    return 1;
  }

  async hget(key, field) {
    const map = this.hashes.get(key);
    return map ? map.get(field) || null : null;
  }

  async hgetall(key) {
    const map = this.hashes.get(key);
    if (!map) return {};
    const obj = {};
    for (const [k, v] of map.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  async zadd(key, score, member) {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    this.sortedSets.get(key).set(member, Number(score));
    return 1;
  }

  async zrevrange(key, start, stop, withScores = false) {
    const set = this.sortedSets.get(key);
    if (!set) return [];
    const entries = Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
    const sliced = entries.slice(start, stop === -1 ? undefined : stop + 1);
    if (withScores) {
      const res = [];
      sliced.forEach(([member, score]) => res.push(member, String(score)));
      return res;
    }
    return sliced.map(([member]) => member);
  }

  async zrange(key, start, stop, withScores = false) {
    const set = this.sortedSets.get(key);
    if (!set) return [];
    const entries = Array.from(set.entries()).sort((a, b) => a[1] - b[1]);
    const sliced = entries.slice(start, stop === -1 ? undefined : stop + 1);
    if (withScores) {
      const res = [];
      sliced.forEach(([member, score]) => res.push(member, String(score)));
      return res;
    }
    return sliced.map(([member]) => member);
  }

  async xadd(streamKey, id, ...fieldValues) {
    if (!this.streams.has(streamKey)) {
      this.streams.set(streamKey, []);
    }
    const generatedId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const data = {};
    for (let i = 0; i < fieldValues.length; i += 2) {
      data[fieldValues[i]] = fieldValues[i + 1];
    }
    const record = { id: id === '*' ? generatedId : id, data };
    const arr = this.streams.get(streamKey);
    arr.push(record);
    // Keep max 5,000 items in memory stream
    if (arr.length > 5000) arr.shift();

    // Notify stream listeners
    if (this.streamListeners.has(streamKey)) {
      for (const listener of this.streamListeners.get(streamKey)) {
        try {
          listener(record);
        } catch (e) {}
      }
    }
    return record.id;
  }

  async eval(script, numKeys, ...args) {
    // Emulate atomic alert check script
    const alertKey = args[0];
    const streamKey = args[1];
    const currentPrice = Number(args[2]);
    const timestamp = args[3];

    const alertMap = this.hashes.get(alertKey);
    if (!alertMap) return [0];

    const symbol = alertMap.get('symbol');
    const condition = alertMap.get('condition');
    const targetPrice = Number(alertMap.get('targetPrice'));
    const isTriggered = Number(alertMap.get('isTriggered') || '0');
    const userId = alertMap.get('userId') || 'user_default';

    let triggeredNow = 0;
    if (isTriggered === 0) {
      if (condition === 'ABOVE' && currentPrice >= targetPrice) {
        triggeredNow = 1;
      } else if (condition === 'BELOW' && currentPrice <= targetPrice) {
        triggeredNow = 1;
      }
    }

    if (triggeredNow === 1) {
      alertMap.set('isTriggered', '1');
      alertMap.set('triggeredAt', String(timestamp));
      const eventId = await this.xadd(
        streamKey,
        '*',
        'alertKey', alertKey,
        'symbol', symbol,
        'condition', condition,
        'targetPrice', String(targetPrice),
        'currentPrice', String(currentPrice),
        'userId', userId,
        'timestamp', String(timestamp)
      );
      return [1, eventId, symbol, condition, targetPrice, currentPrice, userId, timestamp];
    }

    return [0];
  }
}

export class RedisStateLayer {
  constructor(redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379') {
    this.redisUrl = redisUrl;
    this.client = null;
    this.isFallback = false;
    this.fallbackEngine = new InMemoryRedisMock();
    this.luaSha = null;
    this.activeAlertKeys = new Set();
  }

  async initialize() {
    try {
      const realClient = new Redis(this.redisUrl, {
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't infinite loop reconnect if redis is not running
        lazyConnect: true,
      });

      realClient.on('error', (err) => {
        // Silently capture connection error when standalone redis is not available
      });

      await realClient.connect();
      this.client = realClient;
      this.isFallback = false;
      console.log('✅ [Redis] Connected to live Redis instance at', this.redisUrl);
    } catch (err) {
      this.isFallback = true;
      this.client = this.fallbackEngine;
      console.log('ℹ️ [Redis] Running embedded in-memory Redis Hot State & Stream layer (zero external dependency required)');
    }
  }

  async seedInitialMarket(stockList) {
    for (const stock of stockList) {
      await this.recordPriceTick(stock);
    }
    console.log(`⚡ [Redis] Initialized ${stockList.length} symbols in Redis Hashes and Sorted Sets`);
  }

  // 1. Ingest price tick to Hash and Stream
  async recordPriceTick({ symbol, price, previousClose, change, changePercent, sequenceNumber, timestamp, volume, high, low }) {
    const hashKey = `price:${symbol}`;
    const streamKey = 'prices:events';

    // Store latest price hash
    await this.client.hset(hashKey, {
      symbol,
      price: String(price),
      previousClose: String(previousClose),
      change: String(change),
      changePercent: String(changePercent),
      sequenceNumber: String(sequenceNumber),
      timestamp: String(timestamp),
      volume: String(volume || 0),
      high: String(high || price),
      low: String(low || price),
    });

    // Update Sorted Sets: rank:gainers (higher % first) and rank:losers (lower % first)
    await this.client.zadd('rank:gainers', changePercent, symbol);
    await this.client.zadd('rank:losers', -changePercent, symbol);

    // Ingest into Redis Stream
    await this.client.xadd(
      streamKey,
      '*',
      'symbol', symbol,
      'price', String(price),
      'seq', String(sequenceNumber),
      'timestamp', String(timestamp)
    );

    // Evaluate active alerts atomically
    const alertResult = await this.evaluateAlertsForSymbol(symbol, price, timestamp);
    return alertResult;
  }

  // Register alert in Redis
  async registerAlert({ alertId, userId, symbol, condition, targetPrice }) {
    const alertKey = `alert:${alertId}`;
    await this.client.hset(alertKey, {
      alertId,
      userId,
      symbol,
      condition,
      targetPrice: String(targetPrice),
      isTriggered: '0',
    });
    this.activeAlertKeys.add(alertKey);
  }

  async removeAlert(alertId) {
    const alertKey = `alert:${alertId}`;
    this.activeAlertKeys.delete(alertKey);
  }

  // Atomic threshold check with Lua script
  async evaluateAlertsForSymbol(symbol, currentPrice, timestamp) {
    const triggeredAlerts = [];
    for (const alertKey of this.activeAlertKeys) {
      try {
        const res = await this.client.eval(
          ALERT_LUA_SCRIPT,
          2,
          alertKey,
          'alerts:events',
          currentPrice,
          timestamp
        );

        if (Array.isArray(res) && res[0] === 1) {
          triggeredAlerts.push({
            eventId: res[1],
            symbol: res[2],
            condition: res[3],
            targetPrice: Number(res[4]),
            currentPrice: Number(res[5]),
            userId: res[6],
            timestamp: Number(res[7]),
          });
          // Remove from active alert set so we don't re-evaluate
          this.activeAlertKeys.delete(alertKey);
        }
      } catch (err) {
        console.error('[Redis Alert Eval Error]:', err.message);
      }
    }
    return triggeredAlerts;
  }

  // Top gainers from Redis Sorted Set
  async getTopMovers(limit = 10) {
    // Gainers: highest scores
    const gainerSymbols = await this.client.zrevrange('rank:gainers', 0, limit - 1);
    // Losers: lowest scores (stored as negative or ascending)
    const loserSymbols = await this.client.zrevrange('rank:losers', 0, limit - 1);

    const gainers = [];
    for (const sym of gainerSymbols) {
      const data = await this.client.hgetall(`price:${sym}`);
      if (data && data.price) {
        gainers.push({
          symbol: data.symbol,
          price: Number(data.price),
          change: Number(data.change),
          changePercent: Number(data.changePercent),
          volume: Number(data.volume || 0),
        });
      }
    }

    const losers = [];
    for (const sym of loserSymbols) {
      const data = await this.client.hgetall(`price:${sym}`);
      if (data && data.price) {
        losers.push({
          symbol: data.symbol,
          price: Number(data.price),
          change: Number(data.change),
          changePercent: Number(data.changePercent),
          volume: Number(data.volume || 0),
        });
      }
    }

    return { gainers, losers };
  }
}
