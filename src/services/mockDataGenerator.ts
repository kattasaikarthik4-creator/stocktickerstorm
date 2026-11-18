import { Stock } from '../types/market';

// Curated list of well-known anchor symbols
const ANCHOR_STOCKS: Array<{ symbol: string; name: string; basePrice: number }> = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', basePrice: 138.25 },
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 224.50 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', basePrice: 428.10 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 195.40 },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', basePrice: 182.75 },
  { symbol: 'META', name: 'Meta Platforms Inc.', basePrice: 585.30 },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 248.60 },
  { symbol: 'AVGO', name: 'Broadcom Inc.', basePrice: 172.90 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', basePrice: 156.40 },
  { symbol: 'PLTR', name: 'Palantir Technologies', basePrice: 43.80 },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', basePrice: 215.10 },
  { symbol: 'SMCI', name: 'Super Micro Computer', basePrice: 32.40 },
  { symbol: 'LLY', name: 'Eli Lilly and Company', basePrice: 840.20 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', basePrice: 222.80 },
  { symbol: 'V', name: 'Visa Inc.', basePrice: 284.10 },
  { symbol: 'UNH', name: 'UnitedHealth Group', basePrice: 590.40 },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', basePrice: 122.50 },
  { symbol: 'ORCL', name: 'Oracle Corporation', basePrice: 176.30 },
  { symbol: 'NFLX', name: 'Netflix Inc.', basePrice: 712.90 },
  { symbol: 'CRM', name: 'Salesforce Inc.', basePrice: 295.60 },
  { symbol: 'COST', name: 'Costco Wholesale', basePrice: 910.20 },
  { symbol: 'WMT', name: 'Walmart Inc.', basePrice: 81.30 },
  { symbol: 'QCOM', name: 'QUALCOMM Inc.', basePrice: 168.40 },
  { symbol: 'IBM', name: 'International Business Machines', basePrice: 218.70 },
  { symbol: 'INTC', name: 'Intel Corporation', basePrice: 24.15 },
  { symbol: 'ARM', name: 'Arm Holdings plc', basePrice: 142.30 },
  { symbol: 'MU', name: 'Micron Technology', basePrice: 110.50 },
  { symbol: 'PANW', name: 'Palo Alto Networks', basePrice: 365.80 },
  { symbol: 'SNOW', name: 'Snowflake Inc.', basePrice: 128.40 },
  { symbol: 'UBER', name: 'Uber Technologies', basePrice: 78.90 },
  { symbol: 'ABNB', name: 'Airbnb Inc.', basePrice: 134.20 },
  { symbol: 'SQ', name: 'Block Inc.', basePrice: 72.80 },
  { symbol: 'HOOD', name: 'Robinhood Markets', basePrice: 26.90 },
  { symbol: 'DIS', name: 'The Walt Disney Company', basePrice: 96.50 },
  { symbol: 'BA', name: 'The Boeing Company', basePrice: 154.30 },
];

const SECTORS = ['Tech', 'Bio', 'Energy', 'Fin', 'Aero', 'Retail', 'Crypto', 'Media', 'Auto', 'Cloud'];
const SUFFIXES = ['Corp', 'Systems', 'Holdings', 'Inc', 'Labs', 'Dynamics', 'Networks', 'Global', 'Therapeutics', 'Cap'];

export function generateInitialStocks(totalCount: number = 2000): Stock[] {
  const stocks: Stock[] = [];
  const baseTimestamp = Date.now();

  // 1. Add curated anchor stocks
  for (let i = 0; i < ANCHOR_STOCKS.length; i++) {
    const item = ANCHOR_STOCKS[i];
    const prevClose = item.basePrice;
    const initialChangePercent = (Math.random() - 0.48) * 8; // -4% to +4%
    const currentPrice = Number((prevClose * (1 + initialChangePercent / 100)).toFixed(2));
    const change = Number((currentPrice - prevClose).toFixed(2));
    const changePercent = Number(((change / prevClose) * 100).toFixed(2));

    const sparkline = generateSparkline(prevClose, currentPrice, 16);
    const high = Math.max(prevClose, currentPrice, ...sparkline) * (1 + Math.random() * 0.015);
    const low = Math.min(prevClose, currentPrice, ...sparkline) * (1 - Math.random() * 0.015);

    stocks.push({
      symbol: item.symbol,
      name: item.name,
      price: currentPrice,
      previousClose: prevClose,
      change,
      changePercent,
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      volume: Math.floor(500000 + Math.random() * 45000000),
      seq: i + 1,
      timestamp: baseTimestamp - Math.floor(Math.random() * 10000),
      sparkline,
    });
  }

  // 2. Synthesize remaining stocks up to totalCount
  let seqCounter = ANCHOR_STOCKS.length + 1;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let i = stocks.length; i < totalCount; i++) {
    // Generate distinct ticker: e.g. "TCH12", "STK304", or 4-letter symbol
    const prefix1 = letters[Math.floor(Math.random() * letters.length)];
    const prefix2 = letters[Math.floor(Math.random() * letters.length)];
    const prefix3 = letters[Math.floor(Math.random() * letters.length)];
    const numPart = (i % 900) + 100;
    const symbol = `${prefix1}${prefix2}${prefix3}${numPart > 500 ? '' : (i % 10)}`;

    const sector = SECTORS[i % SECTORS.length];
    const suffix = SUFFIXES[i % SUFFIXES.length];
    const name = `${sector} ${prefix1}${prefix2} ${suffix}`;

    const prevClose = Number((15 + Math.random() * 450).toFixed(2));
    const initialChangePercent = (Math.random() - 0.49) * 12; // -6% to +6%
    const currentPrice = Number((prevClose * (1 + initialChangePercent / 100)).toFixed(2));
    const change = Number((currentPrice - prevClose).toFixed(2));
    const changePercent = Number(((change / prevClose) * 100).toFixed(2));

    const sparkline = generateSparkline(prevClose, currentPrice, 16);
    const high = Math.max(prevClose, currentPrice, ...sparkline) * 1.01;
    const low = Math.min(prevClose, currentPrice, ...sparkline) * 0.99;

    stocks.push({
      symbol,
      name,
      price: currentPrice,
      previousClose: prevClose,
      change,
      changePercent,
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      volume: Math.floor(20000 + Math.random() * 8000000),
      seq: seqCounter++,
      timestamp: baseTimestamp - Math.floor(Math.random() * 30000),
      sparkline,
    });
  }

  return stocks;
}

function generateSparkline(startPrice: number, endPrice: number, points: number): number[] {
  const line: number[] = [Number(startPrice.toFixed(2))];
  let curr = startPrice;
  const stepDrift = (endPrice - startPrice) / points;

  for (let i = 1; i < points - 1; i++) {
    const volatility = curr * 0.006;
    const noise = (Math.random() - 0.5) * volatility * 2;
    curr += stepDrift + noise;
    line.push(Number(curr.toFixed(2)));
  }

  line.push(Number(endPrice.toFixed(2)));
  return line;
}
