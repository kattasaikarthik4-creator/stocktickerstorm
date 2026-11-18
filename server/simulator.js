/**
 * TickerStorm High-Performance Market Simulator
 * Generates synthetic real-time market updates for 2,000 symbols up to 5,000 updates/sec
 */

export const ANCHOR_STOCKS = [
  { symbol: 'SPY', name: 'S&P 500 Index ETF', basePrice: 4500.48 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', basePrice: 382.15 },
  { symbol: 'BTC', name: 'Bitcoin', basePrice: 64850.00 },
  { symbol: 'DOGE', name: 'Dogecoin', basePrice: 0.1425 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', basePrice: 138.25 },
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 224.50 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', basePrice: 428.10 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 195.40 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 182.75 },
  { symbol: 'META', name: 'Meta Platforms Inc.', basePrice: 585.30 },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 248.60 },
  { symbol: 'LYZ', name: 'Layzoo Ltd.', basePrice: 142.05 },
  { symbol: 'NBL', name: 'NightBlink Ltd.', basePrice: 118.02 },
  { symbol: 'LCY', name: 'Lcyflame Ltd.', basePrice: 94.58 },
  { symbol: 'FLP', name: 'Feelopie Services Ltd.', basePrice: 82.00 },
  { symbol: 'GRF', name: 'Grofler Ltd.', basePrice: 68.54 },
];

const SECTORS = ['Tech', 'Semis', 'Fin', 'Bio', 'Energy', 'Aero', 'Cloud', 'Crypto', 'Media', 'Retail'];

export class MarketSimulator {
  constructor(totalSymbols = 2000) {
    this.totalSymbols = totalSymbols;
    this.stocks = new Map();
    this.stockList = [];
    this.sequenceNumber = 1000;
    this.isRunning = false;
    this.intervalHandle = null;
    this.targetRate = 500; // updates per sec default
    this.onBatchGenerated = null;
    this.initSymbols();
  }

  initSymbols() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < this.totalSymbols; i++) {
      let symbol, name, basePrice;
      if (i < ANCHOR_STOCKS.length) {
        symbol = ANCHOR_STOCKS[i].symbol;
        name = ANCHOR_STOCKS[i].name;
        basePrice = ANCHOR_STOCKS[i].basePrice;
      } else {
        const p1 = letters[Math.floor(Math.random() * letters.length)];
        const p2 = letters[Math.floor(Math.random() * letters.length)];
        const p3 = letters[Math.floor(Math.random() * letters.length)];
        symbol = `${p1}${p2}${p3}${(i % 900) + 100}`;
        name = `${SECTORS[i % SECTORS.length]} Corp ${p1}${p2}`;
        basePrice = Number((15 + Math.random() * 450).toFixed(2));
      }

      const initialPct = (Math.random() - 0.48) * 6;
      const price = Number((basePrice * (1 + initialPct / 100)).toFixed(2));
      const change = Number((price - basePrice).toFixed(2));
      const changePercent = Number(((change / basePrice) * 100).toFixed(2));

      const stock = {
        symbol,
        name,
        price,
        previousClose: basePrice,
        change,
        changePercent,
        high: Math.max(basePrice, price) * 1.01,
        low: Math.min(basePrice, price) * 0.99,
        volume: Math.floor(50000 + Math.random() * 2000000),
        sequenceNumber: ++this.sequenceNumber,
        timestamp: Date.now(),
        sparkline: [basePrice, price],
      };

      this.stocks.set(symbol, stock);
      this.stockList.push(stock);
    }
  }

  setUpdateRate(ratePerSec) {
    this.targetRate = Math.max(10, Math.min(5000, ratePerSec));
    if (this.isRunning) {
      this.stop();
      this.start(this.onBatchGenerated);
    }
  }

  start(onBatch) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onBatchGenerated = onBatch;

    // Tick interval runs every 25ms (40 batches/sec)
    const tickIntervalMs = 25;
    const ticksPerSec = 1000 / tickIntervalMs;
    const batchSize = Math.max(1, Math.round(this.targetRate / ticksPerSec));

    this.intervalHandle = setInterval(() => {
      const updates = [];
      const now = Date.now();

      for (let i = 0; i < batchSize; i++) {
        // Weight heavily towards active anchor symbols
        const isAnchor = Math.random() < 0.65;
        const index = isAnchor
          ? Math.floor(Math.random() * ANCHOR_STOCKS.length)
          : Math.floor(Math.random() * this.stockList.length);

        const stock = this.stockList[index];
        if (!stock) continue;

        // Volatility jump
        const jumpPercent = (Math.random() - 0.498) * (stock.symbol === 'BTC' || stock.symbol === 'DOGE' ? 1.5 : 0.8);
        let newPrice = Number((stock.price * (1 + jumpPercent / 100)).toFixed(stock.price < 1 ? 4 : 2));
        if (newPrice <= 0.001) newPrice = 0.001;

        const change = Number((newPrice - stock.previousClose).toFixed(stock.price < 1 ? 4 : 2));
        const changePercent = Number(((change / stock.previousClose) * 100).toFixed(2));
        const seq = ++this.sequenceNumber;

        stock.price = newPrice;
        stock.change = change;
        stock.changePercent = changePercent;
        stock.high = Math.max(stock.high, newPrice);
        stock.low = Math.min(stock.low, newPrice);
        stock.volume += Math.floor(100 + Math.random() * 2500);
        stock.sequenceNumber = seq;
        stock.timestamp = now;

        stock.sparkline.push(newPrice);
        if (stock.sparkline.length > 25) stock.sparkline.shift();

        updates.push({
          symbol: stock.symbol,
          price: newPrice,
          previousClose: stock.previousClose,
          change,
          changePercent,
          high: stock.high,
          low: stock.low,
          volume: stock.volume,
          sequenceNumber: seq,
          timestamp: now,
        });
      }

      if (this.onBatchGenerated && updates.length > 0) {
        this.onBatchGenerated(updates);
      }
    }, tickIntervalMs);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  getSnapshot() {
    return {
      stocks: this.stockList,
      watermarkSeq: this.sequenceNumber,
      timestamp: Date.now(),
    };
  }

  getStock(symbol) {
    return this.stocks.get(symbol);
  }
}
