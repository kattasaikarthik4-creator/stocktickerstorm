import React from 'react';
import { Stock } from '../types/market';
import { useMarket } from '../context/MarketContext';
import { Sparkline } from './Sparkline';
import {
  X,
  Star,
  BellPlus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface StockDetailModalProps {
  stock: Stock | null;
  onClose: () => void;
  onOpenAlertModal: (stock: Stock) => void;
  currency?: 'USD' | 'IDR';
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  onClose,
  onOpenAlertModal,
  currency = 'USD',
}) => {
  const { isWatchlist, toggleWatchlist } = useMarket();

  if (!stock) return null;

  const inWatchlist = isWatchlist(stock.symbol);
  const isPos = stock.changePercent >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0d1527] border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex items-start justify-between pr-8 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-2xl font-black text-white">
                {stock.symbol}
              </h2>
              <button
                onClick={() => toggleWatchlist(stock.symbol)}
                className="p-1 rounded-lg hover:bg-slate-800 transition"
                title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                <Star
                  className={`w-5 h-5 ${
                    inWatchlist ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-slate-400">{stock.name}</p>
          </div>

          <div className="text-right">
            <div className="font-mono text-2xl font-black text-slate-100">
              {formatCurrency(stock.price, currency)}
            </div>
            <div
              className={`flex items-center justify-end gap-1 font-mono text-sm font-semibold ${
                isPos ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPos ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>
                {isPos ? '+' : ''}{formatCurrency(stock.change, currency)} ({isPos ? '+' : ''}
                {stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Big Sparkline Card */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>20-Tick Micro Trend</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Activity className="w-3 h-3 animate-pulse" />
              Live Sub-Second Feed
            </span>
          </div>

          <div className="flex justify-center py-2">
            <Sparkline
              data={stock.sparkline}
              width={420}
              height={70}
              isPositive={isPos}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-500 border-t border-slate-800/80 pt-2">
            <span>Low: {formatCurrency(stock.low, currency)}</span>
            <span>High: {formatCurrency(stock.high, currency)}</span>
          </div>
        </div>

        {/* Key Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Prev Close</span>
            <span className="text-slate-200 font-bold">{formatCurrency(stock.previousClose, currency)}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">24h High</span>
            <span className="text-emerald-400 font-bold">{formatCurrency(stock.high, currency)}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">24h Low</span>
            <span className="text-rose-400 font-bold">{formatCurrency(stock.low, currency)}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Total Volume</span>
            <span className="text-slate-200 font-bold">{stock.volume.toLocaleString()}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Seq Watermark</span>
            <span className="text-cyan-400 font-bold">#{stock.seq}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Last Tick</span>
            <span className="text-slate-200 font-bold">
              {new Date(stock.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onOpenAlertModal(stock);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition"
          >
            <BellPlus className="w-4 h-4" />
            <span>Set Threshold Alert</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
