import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { MarketMover, Stock } from '../types/market';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  BellPlus,
  BarChart2,
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface GainersLosersPanelProps {
  onOpenAlertModalForStock: (stock: Stock) => void;
  onSelectStock: (stock: Stock) => void;
  currency?: 'USD' | 'IDR';
}

export const GainersLosersPanel: React.FC<GainersLosersPanelProps> = ({
  onOpenAlertModalForStock,
  onSelectStock,
  currency = 'USD',
}) => {
  const {
    topGainers,
    topLosers,
    stocks,
    stockMap,
    watchlistSymbols,
    toggleWatchlist,
  } = useMarket();

  const [activeSubTab, setActiveSubTab] = useState<'both' | 'gainers' | 'losers'>('both');

  // Calculate Market Breadth (Advancers vs Decliners)
  const advancers = stocks.filter((s) => s.changePercent > 0).length;
  const decliners = stocks.filter((s) => s.changePercent < 0).length;
  const unchanged = stocks.length - advancers - decliners;
  const total = stocks.length || 1;
  const advancerPct = ((advancers / total) * 100).toFixed(1);
  const declinerPct = ((decliners / total) * 100).toFixed(1);

  const renderMoverCard = (mover: MarketMover, rank: number, isGainer: boolean) => {
    const isPinned = watchlistSymbols.has(mover.symbol);
    const fullStock = stockMap.get(mover.symbol);

    return (
      <div
        key={mover.symbol}
        onClick={() => fullStock && onSelectStock(fullStock)}
        className="group relative flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all duration-150"
      >
        {/* Left: Rank & Symbol */}
        <div className="flex items-center gap-3">
          <span
            className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold ${
              rank === 1
                ? isGainer
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            #{rank}
          </span>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                {mover.symbol}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWatchlist(mover.symbol);
                }}
                className="text-slate-600 hover:text-amber-400 p-0.5 rounded transition"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isPinned ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
              {mover.name}
            </p>
          </div>
        </div>

        {/* Right: Price & Percent Change */}
        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <div className="text-sm font-semibold text-slate-100">
              {formatCurrency(mover.price, currency)}
            </div>
            <div
              className={`flex items-center justify-end gap-0.5 text-xs font-medium ${
                isGainer ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isGainer ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>
                {isGainer ? '+' : ''}
                {mover.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Quick Alert Trigger */}
          {fullStock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenAlertModalForStock(fullStock);
              }}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border border-slate-700/60 opacity-0 group-hover:opacity-100 transition"
              title="Set Alert"
            >
              <BellPlus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Market Breadth & Sentiment Card */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-200 text-sm">
              Real-Time Market Breadth (2,000 Instruments)
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-emerald-400">
              ▲ Advancing: <strong>{advancers.toLocaleString()}</strong> ({advancerPct}%)
            </span>
            <span className="text-rose-400">
              ▼ Declining: <strong>{decliners.toLocaleString()}</strong> ({declinerPct}%)
            </span>
            <span className="text-slate-400">
              ■ Neutral: <strong>{unchanged}</strong>
            </span>
          </div>
        </div>

        {/* Visual Ratio Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-800">
          <div
            style={{ width: `${advancerPct}%` }}
            className="h-full bg-emerald-500 transition-all duration-300"
            title={`Advancing: ${advancerPct}%`}
          />
          <div
            style={{ width: `${declinerPct}%` }}
            className="h-full bg-rose-500 transition-all duration-300"
            title={`Declining: ${declinerPct}%`}
          />
        </div>
      </div>

      {/* Subtabs for Responsive Mobile View */}
      <div className="flex md:hidden items-center justify-center p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
        <button
          onClick={() => setActiveSubTab('both')}
          className={`flex-1 py-1.5 rounded-md font-medium transition ${
            activeSubTab === 'both' ? 'bg-slate-800 text-white' : 'text-slate-400'
          }`}
        >
          All Movers
        </button>
        <button
          onClick={() => setActiveSubTab('gainers')}
          className={`flex-1 py-1.5 rounded-md font-medium transition ${
            activeSubTab === 'gainers' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
          }`}
        >
          Top Gainers
        </button>
        <button
          onClick={() => setActiveSubTab('losers')}
          className={`flex-1 py-1.5 rounded-md font-medium transition ${
            activeSubTab === 'losers' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
          }`}
        >
          Top Losers
        </button>
      </div>

      {/* Dual Grid View (Side-by-Side on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top Gainers Column */}
        {(activeSubTab === 'both' || activeSubTab === 'gainers') && (
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#0c1322] border border-emerald-950/60 shadow-xl">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Top 10 Gainers</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Redis ZREVRANGE realtime rank
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Flame className="w-3 h-3 text-emerald-400" />
                BULLISH
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {topGainers.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Streaming rank calculation...
                </div>
              ) : (
                topGainers.map((mover, idx) => renderMoverCard(mover, idx + 1, true))
              )}
            </div>
          </div>
        )}

        {/* Top Losers Column */}
        {(activeSubTab === 'both' || activeSubTab === 'losers') && (
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#0c1322] border border-rose-950/60 shadow-xl">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Top 10 Losers</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Redis ZRANGE realtime rank
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                BEARISH
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {topLosers.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Streaming rank calculation...
                </div>
              ) : (
                topLosers.map((mover, idx) => renderMoverCard(mover, idx + 1, false))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
