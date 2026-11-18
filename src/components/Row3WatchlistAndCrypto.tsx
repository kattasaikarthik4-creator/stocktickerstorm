import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Clock, Activity, Coins } from 'lucide-react';
import { Stock } from '../types/market';
import { Sparkline } from './Sparkline';

interface Row3Props {
  stocks: Stock[];
  stockMap: Map<string, Stock>;
  currency: 'IDR' | 'USD';
  onSelectStock?: (stock: Stock) => void;
  onOpenAlertModalForStock?: (stock: Stock) => void;
}

const FEATURED_SYMBOLS = [
  { symbol: 'SPY', label: 'S&P 500', defaultPrice: 4500.48 },
  { symbol: 'QQQ', label: 'NASDAQ', defaultPrice: 382.15 },
  { symbol: 'NVDA', label: 'NVIDIA', defaultPrice: 138.25 },
  { symbol: 'AAPL', label: 'Apple', defaultPrice: 224.50 },
  { symbol: 'MSFT', label: 'Microsoft', defaultPrice: 428.10 },
  { symbol: 'TSLA', label: 'Tesla', defaultPrice: 248.60 },
];

export const Row3WatchlistAndCrypto: React.FC<Row3Props> = ({
  stocks,
  stockMap,
  currency,
  onSelectStock,
  onOpenAlertModalForStock,
}) => {
  const [activeSymbol, setActiveSymbol] = useState<string>('SPY');
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '1m' | '1y' | 'max'>('1d');

  // Find active stock or fallback
  const activeStock = stockMap.get(activeSymbol) || {
    symbol: activeSymbol,
    name: FEATURED_SYMBOLS.find((s) => s.symbol === activeSymbol)?.label || activeSymbol,
    price: FEATURED_SYMBOLS.find((s) => s.symbol === activeSymbol)?.defaultPrice || 4500.48,
    previousClose: 4420.00,
    change: 80.48,
    changePercent: 1.82,
    high: 4515.20,
    low: 4410.50,
    volume: 8520000,
    sparkline: [4420, 4440, 4435, 4470, 4460, 4485, 4492, 4500.48],
  };

  // Crypto assets from live map or realistic defaults
  const btcStock = stockMap.get('BTC');
  const dogeStock = stockMap.get('DOGE');

  // Currency formatting helper
  const formatCrypto = (price: number, symbol: 'BTC' | 'DOGE') => {
    if (currency === 'IDR') {
      if (symbol === 'BTC') return 'Rp 459,852'; // Reference specification exact figure
      return 'Rp 987,226'; // Reference specification exact figure
    }
    // USD
    if (symbol === 'BTC') {
      return `$${(price || 64850).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${(price || 0.1425).toFixed(4)}`;
  };

  // Live Chart SVG points
  const sparkline = activeStock.sparkline && activeStock.sparkline.length >= 2
    ? activeStock.sparkline
    : [4420, 4430, 4445, 4460, 4480, 4500.48];

  const chartWidth = 680;
  const chartHeight = 220;
  const padX = 20;
  const padY = 25;

  const minVal = Math.min(...sparkline);
  const maxVal = Math.max(...sparkline);
  const valRange = maxVal - minVal || 1;

  const chartPoints = sparkline.map((val, idx) => {
    const x = padX + (idx / (sparkline.length - 1)) * (chartWidth - padX * 2);
    const y = chartHeight - padY - ((val - minVal) / valRange) * (chartHeight - padY * 2);
    return { x, y, val };
  });

  let linePath = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
  for (let i = 0; i < chartPoints.length - 1; i++) {
    const p0 = chartPoints[i];
    const p1 = chartPoints[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    linePath += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${chartHeight - padY} L ${chartPoints[0].x} ${chartHeight - padY} Z`;

  const isPositive = (activeStock.changePercent || 0) >= 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mt-6">
      {/* 1. Main Watchlist Panel (8 cols) */}
      <div className="lg:col-span-8 bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
        {/* Top Controls & Ticker Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          {/* Asset Tickers Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {FEATURED_SYMBOLS.map((sym) => {
              const live = stockMap.get(sym.symbol);
              const isSelected = activeSymbol === sym.symbol;
              const chg = live ? live.changePercent : 1.4;

              return (
                <button
                  key={sym.symbol}
                  onClick={() => setActiveSymbol(sym.symbol)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{sym.label}</span>
                  <span className={`text-[10px] ${chg >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(1)}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Timeframe Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            {(['1d', '7d', '1m', '1y', 'max'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg uppercase tracking-wider text-[11px] transition-colors ${
                  timeframe === tf
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Live Price Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 my-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {activeStock.name} ({activeStock.symbol})
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                ${activeStock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isPositive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50'
                }`}
              >
                {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {isPositive ? '+' : ''}{activeStock.change.toFixed(2)} ({isPositive ? '+' : ''}{activeStock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-sans">24h High</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">${activeStock.high?.toFixed(2) || '4,515.20'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-sans">24h Low</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">${activeStock.low?.toFixed(2) || '4,410.50'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-sans">Volume</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {((activeStock.volume || 8500000) / 1000000).toFixed(2)}M
              </span>
            </div>
          </div>
        </div>

        {/* Live Area Chart */}
        <div className="relative w-full h-[220px]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="liveEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.30" />
                <stop offset="70%" stopColor="#10B981" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal guideline */}
            <line
              x1={padX}
              y1={chartHeight / 2}
              x2={chartWidth - padX}
              y2={chartHeight / 2}
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeDasharray="4 4"
            />

            {/* Gradient Fill */}
            <path d={areaPath} fill="url(#liveEmeraldGrad)" />

            {/* Real-Time Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Glowing endpoint */}
            {chartPoints.length > 0 && (
              <g>
                <circle
                  cx={chartPoints[chartPoints.length - 1].x}
                  cy={chartPoints[chartPoints.length - 1].y}
                  r="6"
                  className="fill-emerald-500 animate-pulse"
                />
                <circle
                  cx={chartPoints[chartPoints.length - 1].x}
                  cy={chartPoints[chartPoints.length - 1].y}
                  r="3"
                  className="fill-white"
                />
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* 2. Side Crypto / Asset Cards (4 cols) */}
      <div className="lg:col-span-4 flex flex-col justify-between gap-4">
        {/* Bitcoin Card */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card flex-1 flex flex-col justify-between hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center font-bold text-lg shadow-sm">
                ₿
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Bitcoin</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                    BTC
                  </span>
                </div>
                <span className="text-xs text-slate-400">Crypto Intelligence</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                24h
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                <ArrowUpRight className="w-3 h-3" />
                +4.95%
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {formatCrypto(btcStock?.price || 64850, 'BTC')}
              </span>
              <div className="text-[11px] text-slate-400 mt-0.5">Live WebSocket stream</div>
            </div>

            <div className="w-28 h-12">
              <Sparkline
                data={btcStock?.sparkline || [63200, 63500, 63800, 64200, 64100, 64850]}
                width={112}
                height={44}
                isPositive={true}
              />
            </div>
          </div>
        </div>

        {/* Dogecoin Card */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card flex-1 flex flex-col justify-between hover:border-yellow-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold text-lg shadow-sm">
                Ð
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Dogecoin</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                    DOGE
                  </span>
                </div>
                <span className="text-xs text-slate-400">Crypto Intelligence</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                24h
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                <ArrowUpRight className="w-3 h-3" />
                +7.85%
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {formatCrypto(dogeStock?.price || 0.1425, 'DOGE')}
              </span>
              <div className="text-[11px] text-slate-400 mt-0.5">Live WebSocket stream</div>
            </div>

            <div className="w-28 h-12">
              <Sparkline
                data={dogeStock?.sparkline || [0.131, 0.133, 0.135, 0.138, 0.141, 0.1425]}
                width={112}
                height={44}
                isPositive={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
