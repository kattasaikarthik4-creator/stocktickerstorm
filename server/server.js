import express from 'express';
import http from 'http';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { db, initDatabase, findUserByEmail, findUserById, createUser, verifyPassword } from './db.js';
import { RedisStateLayer } from './redisLayer.js';
import { MarketSimulator } from './simulator.js';

const PORT = process.env.PORT || 8080;
const BUFFER_LIMIT_BYTES = 64 * 1024; // 64KB backpressure threshold

// Initialize DB and Redis
initDatabase();
const redisLayer = new RedisStateLayer();
await redisLayer.initialize();

// Initialize Market Simulator for 2,000 symbols
const simulator = new MarketSimulator(2000);
await redisLayer.seedInitialMarket(simulator.stockList);

// Setup Express app
const app = express();
app.use(cors());
app.use(express.json());

const __server_dir = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__server_dir, '..', 'dist');
app.use(express.static(distPath));

// Track client connection state and coalescing queues
const clientContexts = new Map();

// In-Memory Auth Session Store (token -> { userId, expiresAt })
const activeSessions = new Map();

function generateToken(userId) {
  const token = `tk_${crypto.randomBytes(24).toString('hex')}`;
  activeSessions.set(token, {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return null;
  }
  return findUserById(session.userId);
}

// ==========================================
// AUTHENTICATION REST API ENDPOINTS
// ==========================================

// 1. User Registration
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const newUser = createUser({ name, email, password });
    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err.message);
    res.status(500).json({ error: 'Failed to create user account.' });
  }
});

// 2. User Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name || 'Trader',
        email: user.email,
      },
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err.message);
    res.status(500).json({ error: 'Authentication failed.' });
  }
});

// 3. Current Authenticated User (Session Verification)
app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized or session expired.' });
  }
  res.json({
    user: {
      id: user.id,
      name: user.name || 'Trader',
      email: user.email,
      createdAt: user.created_at,
    },
  });
});

// 4. User Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ==========================================
// STOCKS REST API SUITE
// ==========================================

// 1. Comprehensive Stocks Catalog & Screener API
// Supports: search, pagination (limit/offset), sorting, and price range filters
app.get('/api/stocks', (req, res) => {
  try {
    const {
      search = '',
      limit = '50',
      offset = '0',
      sortBy = 'volume',
      order = 'desc',
      minPrice,
      maxPrice,
    } = req.query;

    let results = [...simulator.stockList];

    // Filter by search query (symbol or name)
    if (search) {
      const q = String(search).toLowerCase().trim();
      results = results.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    // Filter by price bounds
    if (minPrice) {
      const min = Number(minPrice);
      if (!isNaN(min)) results = results.filter((s) => s.price >= min);
    }
    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) results = results.filter((s) => s.price <= max);
    }

    // Sort results
    const isDesc = String(order).toLowerCase() !== 'asc';
    results.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === 'string') {
        return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return isDesc ? valB - valA : valA - valB;
    });

    const parsedLimit = Math.max(1, Math.min(500, parseInt(limit, 10) || 50));
    const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);
    const paginated = results.slice(parsedOffset, parsedOffset + parsedLimit);

    res.json({
      success: true,
      total: results.length,
      limit: parsedLimit,
      offset: parsedOffset,
      count: paginated.length,
      watermarkSeq: simulator.sequenceNumber,
      timestamp: Date.now(),
      data: paginated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fast Autocomplete Search Endpoint
app.get('/api/stocks/search/autocomplete', (req, res) => {
  try {
    const q = String(req.query.q || '').toLowerCase().trim();
    if (!q) {
      return res.json({ matches: [] });
    }

    const matches = simulator.stockList
      .filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .slice(0, 10)
      .map((s) => ({
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        change: s.change,
        changePercent: s.changePercent,
        volume: s.volume,
      }));

    res.json({ query: q, count: matches.length, matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Detailed Single Stock Intelligence & Technical Analytics
app.get('/api/stocks/:symbol', async (req, res) => {
  try {
    const symbol = String(req.params.symbol).toUpperCase().trim();
    const stock = simulator.getStock(symbol);

    if (!stock) {
      return res.status(404).json({ error: `Stock symbol '${symbol}' not found in active market.` });
    }

    // Query latest hot-state Redis hash
    let redisData = null;
    try {
      redisData = await redisLayer.client.hgetall(`price:${symbol}`);
    } catch {
      // fallback to simulator memory
    }

    const currentPrice = redisData?.price ? Number(redisData.price) : stock.price;
    const previousClose = stock.previousClose;
    const change = Number((currentPrice - previousClose).toFixed(currentPrice < 1 ? 4 : 2));
    const changePercent = Number(((change / previousClose) * 100).toFixed(2));

    // Simulated institutional order book depth (Level 2)
    const spreadCents = currentPrice < 1 ? 0.0005 : currentPrice < 100 ? 0.02 : 0.05;
    const bids = [
      { price: Number((currentPrice - spreadCents * 1).toFixed(currentPrice < 1 ? 4 : 2)), size: 1200, orders: 8 },
      { price: Number((currentPrice - spreadCents * 2).toFixed(currentPrice < 1 ? 4 : 2)), size: 2450, orders: 14 },
      { price: Number((currentPrice - spreadCents * 3).toFixed(currentPrice < 1 ? 4 : 2)), size: 4800, orders: 22 },
      { price: Number((currentPrice - spreadCents * 4).toFixed(currentPrice < 1 ? 4 : 2)), size: 7100, orders: 31 },
      { price: Number((currentPrice - spreadCents * 5).toFixed(currentPrice < 1 ? 4 : 2)), size: 12500, orders: 45 },
    ];
    const asks = [
      { price: Number((currentPrice + spreadCents * 1).toFixed(currentPrice < 1 ? 4 : 2)), size: 950, orders: 6 },
      { price: Number((currentPrice + spreadCents * 2).toFixed(currentPrice < 1 ? 4 : 2)), size: 2100, orders: 12 },
      { price: Number((currentPrice + spreadCents * 3).toFixed(currentPrice < 1 ? 4 : 2)), size: 3900, orders: 19 },
      { price: Number((currentPrice + spreadCents * 4).toFixed(currentPrice < 1 ? 4 : 2)), size: 6800, orders: 28 },
      { price: Number((currentPrice + spreadCents * 5).toFixed(currentPrice < 1 ? 4 : 2)), size: 11200, orders: 40 },
    ];

    // Compute technical indicators
    const rsi14 = Math.min(85, Math.max(25, Number((50 + changePercent * 4.2).toFixed(1))));
    const trendSignal = rsi14 > 65 ? 'STRONG_BUY' : rsi14 > 52 ? 'BULLISH' : rsi14 < 38 ? 'STRONG_SELL' : 'NEUTRAL';

    // Fundamentals
    const sharesOutstanding = 2500000000;
    const marketCap = currentPrice * sharesOutstanding;
    const week52High = Number((Math.max(stock.high, currentPrice) * 1.15).toFixed(2));
    const week52Low = Number((Math.min(stock.low, currentPrice) * 0.78).toFixed(2));

    res.json({
      symbol: stock.symbol,
      name: stock.name,
      price: currentPrice,
      previousClose,
      change,
      changePercent,
      high: Math.max(stock.high, currentPrice),
      low: Math.min(stock.low, currentPrice),
      volume: stock.volume,
      sequenceNumber: stock.sequenceNumber,
      timestamp: Date.now(),
      sparkline: stock.sparkline,
      fundamentals: {
        marketCap,
        formattedMarketCap: marketCap >= 1e12 ? `$${(marketCap / 1e12).toFixed(2)}T` : `$${(marketCap / 1e9).toFixed(2)}B`,
        peRatio: Number((22.4 + (currentPrice % 15)).toFixed(1)),
        beta: Number((0.95 + (currentPrice % 8) * 0.08).toFixed(2)),
        week52High,
        week52Low,
        avgVolume30Day: stock.volume * 1.2,
        dividendYield: symbol === 'SPY' ? 1.48 : symbol === 'AAPL' ? 0.52 : symbol === 'MSFT' ? 0.71 : 0.0,
      },
      technicals: {
        rsi14,
        trendSignal,
        sma20: Number((currentPrice * 0.985).toFixed(2)),
        sma50: Number((currentPrice * 0.962).toFixed(2)),
        macd: {
          macdLine: Number((change * 0.45).toFixed(2)),
          signalLine: Number((change * 0.38).toFixed(2)),
          histogram: Number((change * 0.07).toFixed(2)),
        },
      },
      orderBook: {
        spread: spreadCents * 2,
        bids,
        asks,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Historical Timeframe Candles / Data Points
app.get('/api/stocks/:symbol/history', (req, res) => {
  try {
    const symbol = String(req.params.symbol).toUpperCase().trim();
    const stock = simulator.getStock(symbol);

    if (!stock) {
      return res.status(404).json({ error: `Stock symbol '${symbol}' not found.` });
    }

    const { timeframe = '1d' } = req.query;
    const currentPrice = stock.price;

    let pointsCount = 24;
    let stepMs = 3600 * 1000;
    if (timeframe === '7d') {
      pointsCount = 28;
      stepMs = 6 * 3600 * 1000;
    } else if (timeframe === '1m') {
      pointsCount = 30;
      stepMs = 24 * 3600 * 1000;
    } else if (timeframe === '1y') {
      pointsCount = 52;
      stepMs = 7 * 24 * 3600 * 1000;
    }

    const now = Date.now();
    const history = [];
    let walkingPrice = stock.previousClose;

    for (let i = pointsCount; i >= 0; i--) {
      const timestamp = now - i * stepMs;
      const progress = 1 - i / pointsCount;
      const target = currentPrice;
      const noise = (Math.random() - 0.49) * (currentPrice * 0.015);
      walkingPrice = Number((stock.previousClose + (target - stock.previousClose) * progress + noise).toFixed(2));

      history.push({
        timestamp,
        time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: walkingPrice,
        volume: Math.floor(10000 + Math.random() * 50000),
      });
    }

    res.json({
      symbol,
      timeframe,
      currentPrice,
      pointsCount: history.length,
      history,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CORE REST API ENDPOINTS
// ==========================================

// Health & Resilience Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: redisLayer.isFallback ? 'embedded-in-memory-redis' : 'distributed-redis',
    connectedClients: wss.clients.size,
    watermarkSeq: simulator.sequenceNumber,
    activeSymbols: simulator.totalSymbols,
    targetRate: simulator.targetRate,
    timestamp: Date.now(),
  });
});

// Portfolios & Top Metrics (Supports Authenticated User Scope)
app.get('/api/portfolio', (req, res) => {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser?.id || 'user_alex_morgan_01';

    let portfolios = db.prepare('SELECT * FROM portfolios WHERE user_id = ?').all(userId);
    if (portfolios.length === 0) {
      // Fallback to all or default if new user has none
      portfolios = db.prepare('SELECT * FROM portfolios').all();
    }

    const core = portfolios.find((p) => p.category === 'core') || {
      total_value: 10125.0,
      invested_amount: 8032.0,
      roi_percent: 26.06,
    };
    const targets = portfolios.filter((p) => p.category === 'target');

    res.json({
      overview: {
        indexValue: 60021.21,
        indexChangePercent: 1.42,
        investedCapital: core.invested_amount,
        currentValuation: core.total_value,
        roiPercent: 28.2, // Reference design ROI badge
      },
      targets,
      allPortfolios: portfolios,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add dynamic target portfolio
app.post('/api/portfolio/targets', (req, res) => {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser?.id || 'user_alex_morgan_01';
    const { name, target_amount, total_value = 0, invested_amount = 0 } = req.body;

    if (!name || !target_amount) {
      return res.status(400).json({ error: 'Name and target amount are required.' });
    }

    const portId = `port_${userId}_${Date.now()}`;
    const roi = invested_amount > 0 ? Number((((total_value - invested_amount) / invested_amount) * 100).toFixed(2)) : 2.5;

    db.prepare(`
      INSERT INTO portfolios (id, user_id, name, total_value, invested_amount, roi_percent, target_amount, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'target')
    `).run(portId, userId, name, Number(total_value), Number(invested_amount), roi, Number(target_amount));

    res.json({
      success: true,
      target: {
        id: portId,
        user_id: userId,
        name,
        total_value: Number(total_value),
        invested_amount: Number(invested_amount),
        roi_percent: roi,
        target_amount: Number(target_amount),
        category: 'target',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fund Sectors
app.get('/api/fund/sectors', (req, res) => {
  try {
    const sectors = db.prepare('SELECT * FROM fund_sectors ORDER BY allocation_percent DESC').all();
    res.json(sectors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fund Companies
app.get('/api/fund/companies', (req, res) => {
  try {
    const companies = db.prepare('SELECT * FROM fund_companies ORDER BY allocation_percent DESC').all();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fund Managers (Schemes Managed By)
app.get('/api/fund/managers', (req, res) => {
  try {
    const managers = db.prepare('SELECT * FROM fund_managers').all();
    res.json(managers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Durable Alerts CRUD
app.get('/api/alerts', (req, res) => {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser?.id;

    let alerts;
    if (userId) {
      alerts = db.prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    } else {
      alerts = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all();
    }
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts', async (req, res) => {
  const authUser = getAuthUser(req);
  const { symbol, targetPrice, condition, userId = authUser?.id || 'user_alex_morgan_01' } = req.body;
  if (!symbol || !targetPrice || !condition) {
    return res.status(400).json({ error: 'Missing required alert parameters' });
  }

  const alertId = `alt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    // 1. Persist to SQLite
    db.prepare(`
      INSERT INTO alerts (id, user_id, symbol, target_price, condition, is_triggered)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(alertId, userId, symbol.toUpperCase(), Number(targetPrice), condition);

    // 2. Register with Redis state layer
    await redisLayer.registerAlert({
      alertId,
      userId,
      symbol: symbol.toUpperCase(),
      condition,
      targetPrice: Number(targetPrice),
    });

    res.json({ success: true, alertId, symbol, targetPrice, condition });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/alerts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
    await redisLayer.removeAlert(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dynamic Simulator Speed Control
app.post('/api/simulator/rate', (req, res) => {
  const rate = Number(req.body.rate);
  if (!rate || rate < 10 || rate > 5000) {
    return res.status(400).json({ error: 'Rate must be between 10 and 5000 updates/sec' });
  }
  simulator.setUpdateRate(rate);
  res.json({ success: true, targetRate: simulator.targetRate });
});

// Fallback for single page application (SPA)
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// HTTP Server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  // Track slow client backpressure queue for latest-value coalescing
  const context = {
    id: clientId,
    coalescedUpdates: new Map(), // symbol -> latest update
    isBackpressured: false,
  };
  clientContexts.set(ws, context);

  // Send full snapshot upon connection
  const snapshot = simulator.getSnapshot();
  ws.send(JSON.stringify({
    type: 'snapshot',
    stocks: snapshot.stocks,
    watermarkSeq: snapshot.watermarkSeq,
    timestamp: snapshot.timestamp,
  }));

  // Send initial top movers
  redisLayer.getTopMovers(10).then(({ gainers, losers }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'top_movers',
        gainers,
        losers,
        seq: simulator.sequenceNumber,
      }));
    }
  });

  // Client message handling
  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          serverTime: Date.now(),
          clientEchoTime: msg.timestamp,
          watermarkSeq: simulator.sequenceNumber,
        }));
      } else if (msg.type === 'set_alert') {
        const alertId = `alt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await redisLayer.registerAlert({
          alertId,
          userId: msg.userId || 'user_alex_morgan_01',
          symbol: msg.alert.symbol.toUpperCase(),
          condition: msg.alert.condition,
          targetPrice: Number(msg.alert.targetPrice),
        });
        ws.send(JSON.stringify({
          type: 'alert_registered',
          alertId,
        }));
      } else if (msg.type === 'remove_alert') {
        await redisLayer.removeAlert(msg.id);
      }
    } catch (e) {
      console.error('[WS] Parse error:', e.message);
    }
  });

  ws.on('close', () => {
    clientContexts.delete(ws);
  });
});

// Start Simulator generation loop
simulator.start(async (batchUpdates) => {
  if (wss.clients.size === 0) return;

  // Process updates into Redis & Evaluate Alerts
  const triggeredAlerts = [];
  for (const update of batchUpdates) {
    const alerts = await redisLayer.recordPriceTick(update);
    if (alerts && alerts.length > 0) {
      triggeredAlerts.push(...alerts);
    }
  }

  // Deliver Triggered Alerts immediately
  if (triggeredAlerts.length > 0) {
    for (const alt of triggeredAlerts) {
      const alertMsg = JSON.stringify({
        type: 'alert_triggered',
        alert: {
          id: alt.eventId || `alt_event_${Date.now()}`,
          ruleId: alt.alertKey || 'rule',
          symbol: alt.symbol,
          condition: alt.condition,
          targetPrice: alt.targetPrice,
          currentPrice: alt.currentPrice,
          timestamp: alt.timestamp || Date.now(),
          read: false,
        },
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(alertMsg);
        }
      });
    }
  }

  // Broadcast ticker updates with Backpressure Coalescing for slow clients
  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;

    const ctx = clientContexts.get(client);
    if (!ctx) return;

    // Check backpressure: if bufferedAmount exceeds threshold, coalesce!
    if (client.bufferedAmount > BUFFER_LIMIT_BYTES) {
      ctx.isBackpressured = true;
      // Merge latest value per symbol
      for (const update of batchUpdates) {
        ctx.coalescedUpdates.set(update.symbol, update);
      }
      return;
    }

    // Client is healthy: flush any previously coalesced updates + current batch
    if (ctx.isBackpressured && ctx.coalescedUpdates.size > 0) {
      const merged = Array.from(ctx.coalescedUpdates.values());
      ctx.coalescedUpdates.clear();
      ctx.isBackpressured = false;
      client.send(JSON.stringify({
        type: 'ticker_update',
        updates: merged,
        watermarkSeq: simulator.sequenceNumber,
        coalesced: true,
      }));
    } else {
      client.send(JSON.stringify({
        type: 'ticker_update',
        updates: batchUpdates,
        watermarkSeq: simulator.sequenceNumber,
      }));
    }
  });
});

// Periodic Redis Top Movers push every 1.5 seconds
setInterval(async () => {
  if (wss.clients.size === 0) return;
  const { gainers, losers } = await redisLayer.getTopMovers(10);
  const msg = JSON.stringify({
    type: 'top_movers',
    gainers,
    losers,
    seq: simulator.sequenceNumber,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.bufferedAmount < BUFFER_LIMIT_BYTES) {
      client.send(msg);
    }
  });
}, 1500);

server.listen(PORT, () => {
  console.log(`🚀 [TickerStorm Server] Running on http://localhost:${PORT} and ws://localhost:${PORT}`);
});
