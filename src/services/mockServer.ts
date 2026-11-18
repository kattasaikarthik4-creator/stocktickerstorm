import { Stock, MarketMover, AlertRule, AlertEvent, InboundWSMessage } from '../types/market';
import { generateInitialStocks } from './mockDataGenerator';

export class MockWebSocketEngine {
  private stocks: Map<string, Stock> = new Map();
  private stockList: Stock[] = [];
  private currentSeq = 1000;
  private intervalId: number | null = null;
  private topMoversIntervalId: number | null = null;
  private isRunning = false;
  private updateRatePerSec = 400; // default 400 updates/sec
  private onMessageCallback: ((msg: InboundWSMessage) => void) | null = null;
  private onStatusChangeCallback: ((status: 'connected' | 'reconnecting' | 'disconnected') => void) | null = null;
  private alertRules: Map<string, AlertRule> = new Map();
  private historyBuffer: Array<{ symbol: string; price: number; seq: number; timestamp: number }> = [];
  private maxHistory = 10000;
  private artificialLatencyMs = 0;
  private droppedPacketsCount = 0;
  private isDropSimulated = false;

  constructor(initialCount = 2000) {
    const generated = generateInitialStocks(initialCount);
    this.stockList = generated;
    generated.forEach((s) => this.stocks.set(s.symbol, s));
    this.currentSeq = generated.length + 10;
  }

  public setCallbacks(
    onMessage: (msg: InboundWSMessage) => void,
    onStatusChange: (status: 'connected' | 'reconnecting' | 'disconnected') => void
  ) {
    this.onMessageCallback = onMessage;
    this.onStatusChangeCallback = onStatusChange;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onStatusChangeCallback?.('connected');

    // Send initial snapshot
    const snapshot: InboundWSMessage = {
      type: 'snapshot',
      stocks: Array.from(this.stocks.values()),
      watermarkSeq: this.currentSeq,
      timestamp: Date.now(),
    };
    this.deliverMessage(snapshot);

    // Initial top movers calculation
    this.emitTopMovers();

    // Start ticker update generation loop
    this.scheduleUpdates();

    // Recompute top movers every 1.5 seconds (mirrors Redis ZREVRANGE / ZRANGE)
    this.topMoversIntervalId = window.setInterval(() => {
      if (this.isRunning && !this.isDropSimulated) {
        this.emitTopMovers();
      }
    }, 1500);
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.topMoversIntervalId !== null) {
      clearInterval(this.topMoversIntervalId);
      this.topMoversIntervalId = null;
    }
    this.onStatusChangeCallback?.('disconnected');
  }

  public setRate(updatesPerSec: number) {
    this.updateRatePerSec = Math.max(10, Math.min(5000, updatesPerSec));
    if (this.isRunning && !this.isDropSimulated) {
      this.scheduleUpdates();
    }
  }

  public setArtificialLatency(ms: number) {
    this.artificialLatencyMs = Math.max(0, ms);
  }

  public simulateConnectionDrop(durationMs = 3000) {
    if (this.isDropSimulated) return;
    this.isDropSimulated = true;
    this.onStatusChangeCallback?.('disconnected');

    // Stop sending updates during drop
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // After duration, transition to reconnecting then connected
    setTimeout(() => {
      this.onStatusChangeCallback?.('reconnecting');
      setTimeout(() => {
        this.isDropSimulated = false;
        this.onStatusChangeCallback?.('connected');
        if (this.isRunning) {
          this.scheduleUpdates();
        }
      }, 1200);
    }, durationMs);
  }

  public registerAlertRule(rule: AlertRule) {
    this.alertRules.set(rule.id, rule);
  }

  public removeAlertRule(ruleId: string) {
    this.alertRules.delete(ruleId);
  }

  public handleClientMessage(msgStr: string) {
    try {
      const msg = JSON.parse(msgStr);
      if (msg.type === 'sync_request') {
        const fromSeq = Number(msg.fromSeq) || 0;
        this.handleSyncRequest(fromSeq);
      } else if (msg.type === 'ping') {
        this.deliverMessage({
          type: 'heartbeat',
          serverTime: Date.now(),
          clientEchoTime: msg.timestamp,
          watermarkSeq: this.currentSeq,
        });
      } else if (msg.type === 'set_alert') {
        const rule: AlertRule = {
          id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          symbol: msg.alert.symbol,
          condition: msg.alert.condition,
          targetPrice: Number(msg.alert.targetPrice),
          createdAt: Date.now(),
          triggered: false,
          notes: msg.alert.notes,
        };
        this.registerAlertRule(rule);
      } else if (msg.type === 'remove_alert') {
        this.removeAlertRule(msg.id);
      }
    } catch {
      // Ignore parse errors
    }
  }

  private handleSyncRequest(fromSeq: number) {
    // Look up updates in historyBuffer where seq > fromSeq
    const missed = this.historyBuffer.filter((h) => h.seq > fromSeq);
    if (missed.length > 0) {
      // Send missed updates
      this.deliverMessage({
        type: 'ticker_update',
        updates: missed,
        watermarkSeq: this.currentSeq,
      });
    }

    this.deliverMessage({
      type: 'sync_ack',
      syncedUpToSeq: this.currentSeq,
      missedUpdatesCount: missed.length,
    });
  }

  private scheduleUpdates() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }

    // Determine batch size and interval for smooth frame delivery
    // Target 30-50 batches per second
    const tickIntervalMs = 25; // 40 times per second
    const updatesPerTick = Math.max(1, Math.round((this.updateRatePerSec * tickIntervalMs) / 1000));

    this.intervalId = window.setInterval(() => {
      if (!this.isRunning || this.isDropSimulated) return;
      this.emitBatchUpdate(updatesPerTick);
    }, tickIntervalMs);
  }

  private emitBatchUpdate(count: number) {
    const updates: Array<Partial<Stock> & { symbol: string; price: number; seq: number; timestamp: number }> = [];
    const now = Date.now();
    const stockCount = this.stockList.length;

    for (let i = 0; i < count; i++) {
      // Weighted selection: anchor stocks (first 35) update more frequently (70% probability)
      const isAnchor = Math.random() < 0.7;
      const index = isAnchor
        ? Math.floor(Math.random() * Math.min(35, stockCount))
        : Math.floor(Math.random() * stockCount);

      const stock = this.stockList[index];
      if (!stock) continue;

      // Random walk price jump (-0.8% to +0.8%)
      const jumpPercent = (Math.random() - 0.498) * 1.2;
      let newPrice = Number((stock.price * (1 + jumpPercent / 100)).toFixed(2));
      if (newPrice <= 0.05) newPrice = 0.05;

      const change = Number((newPrice - stock.previousClose).toFixed(2));
      const changePercent = Number(((change / stock.previousClose) * 100).toFixed(2));
      const high = Math.max(stock.high, newPrice);
      const low = Math.min(stock.low, newPrice);
      const addedVolume = Math.floor(100 + Math.random() * 8500);

      this.currentSeq++;
      const seq = this.currentSeq;

      // Update in-memory stock object
      stock.price = newPrice;
      stock.change = change;
      stock.changePercent = changePercent;
      stock.high = high;
      stock.low = low;
      stock.volume += addedVolume;
      stock.seq = seq;
      stock.timestamp = now;

      // Append sparkline (keep 20 points)
      stock.sparkline.push(newPrice);
      if (stock.sparkline.length > 20) {
        stock.sparkline.shift();
      }

      const updatePayload = {
        symbol: stock.symbol,
        price: newPrice,
        change,
        changePercent,
        high,
        low,
        volume: stock.volume,
        seq,
        timestamp: now,
      };

      updates.push(updatePayload);

      // Record to history buffer for watermark sync backfill
      this.historyBuffer.push({
        symbol: stock.symbol,
        price: newPrice,
        seq,
        timestamp: now,
      });

      // Check threshold alerts
      this.checkAlerts(stock);
    }

    if (this.historyBuffer.length > this.maxHistory) {
      this.historyBuffer.splice(0, this.historyBuffer.length - this.maxHistory);
    }

    if (updates.length > 0) {
      this.deliverMessage({
        type: 'ticker_update',
        updates,
        watermarkSeq: this.currentSeq,
      });
    }
  }

  private checkAlerts(stock: Stock) {
    this.alertRules.forEach((rule) => {
      if (rule.symbol !== stock.symbol || rule.triggered) return;

      const isTriggered =
        (rule.condition === 'ABOVE' && stock.price >= rule.targetPrice) ||
        (rule.condition === 'BELOW' && stock.price <= rule.targetPrice);

      if (isTriggered) {
        rule.triggered = true;
        const alertEvent: AlertEvent = {
          id: `alert-event-${Date.now()}-${rule.id}`,
          ruleId: rule.id,
          symbol: rule.symbol,
          condition: rule.condition,
          targetPrice: rule.targetPrice,
          currentPrice: stock.price,
          timestamp: Date.now(),
          read: false,
        };

        this.deliverMessage({
          type: 'alert_triggered',
          alert: alertEvent,
        });
      }
    });
  }

  private emitTopMovers() {
    const all = Array.from(this.stocks.values());
    // Sort by changePercent descending (Gainers)
    const sortedGainers = [...all]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 10)
      .map(toMover);

    // Sort by changePercent ascending (Losers)
    const sortedLosers = [...all]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 10)
      .map(toMover);

    this.deliverMessage({
      type: 'top_movers',
      gainers: sortedGainers,
      losers: sortedLosers,
      seq: this.currentSeq,
    });
  }

  private deliverMessage(msg: InboundWSMessage) {
    if (!this.onMessageCallback) return;

    if (this.artificialLatencyMs > 0) {
      setTimeout(() => {
        if (!this.isDropSimulated && this.onMessageCallback) {
          this.onMessageCallback(msg);
        }
      }, this.artificialLatencyMs);
    } else {
      this.onMessageCallback(msg);
    }
  }

  public getStats() {
    return {
      watermarkSeq: this.currentSeq,
      totalStocks: this.stockList.length,
      activeAlertRules: this.alertRules.size,
      updateRate: this.updateRatePerSec,
      droppedPackets: this.droppedPacketsCount,
    };
  }
}

function toMover(s: Stock): MarketMover {
  return {
    symbol: s.symbol,
    name: s.name,
    price: s.price,
    change: s.change,
    changePercent: s.changePercent,
    volume: s.volume,
  };
}
