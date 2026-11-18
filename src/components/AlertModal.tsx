import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { Stock } from '../types/market';
import { X, Bell, TrendingUp, TrendingDown, ArrowRight, ShieldCheck } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStock?: Stock | null;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  initialStock,
}) => {
  const { stocks, createAlertRule } = useMarket();

  const [symbol, setSymbol] = useState(initialStock?.symbol || 'NVDA');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Selected stock details
  const selectedStock = stocks.find((s) => s.symbol === symbol) || initialStock;

  useEffect(() => {
    if (initialStock) {
      setSymbol(initialStock.symbol);
      const offset = condition === 'ABOVE' ? 1.02 : 0.98;
      setTargetPrice((initialStock.price * offset).toFixed(2));
    } else if (selectedStock && !targetPrice) {
      const offset = condition === 'ABOVE' ? 1.02 : 0.98;
      setTargetPrice((selectedStock.price * offset).toFixed(2));
    }
  }, [initialStock, condition, selectedStock, targetPrice]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    createAlertRule(symbol, condition, priceNum, notes.trim() || undefined);
    onClose();
  };

  const handleQuickPercent = (percent: number) => {
    if (!selectedStock) return;
    const computed = (selectedStock.price * (1 + percent / 100)).toFixed(2);
    setTargetPrice(computed);
    if (percent > 0) setCondition('ABOVE');
    else setCondition('BELOW');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0e1626] border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Create Price Alert</h2>
            <p className="text-xs text-slate-400">
              Trigger instant WebSocket notifications when threshold is crossed
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Symbol Selector */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
              Select Symbol
            </label>
            <div className="relative">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. NVDA, AAPL, MSFT"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm uppercase text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Current Market Price Banner */}
          {selectedStock && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Current Market Price:</span>
                <span className="font-mono font-bold text-slate-100 ml-2">
                  ${selectedStock.price.toFixed(2)}
                </span>
              </div>
              <span
                className={`font-mono font-semibold ${
                  selectedStock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {selectedStock.changePercent >= 0 ? '+' : ''}
                {selectedStock.changePercent.toFixed(2)}%
              </span>
            </div>
          )}

          {/* Condition: Above vs Below */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
              Alert Trigger Condition
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCondition('ABOVE')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition ${
                  condition === 'ABOVE'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Crosses Above (≥)
              </button>
              <button
                type="button"
                onClick={() => setCondition('BELOW')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition ${
                  condition === 'BELOW'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-rose-400" />
                Crosses Below (≤)
              </button>
            </div>
          </div>

          {/* Target Price */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
              Target Price ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Quick offset buttons (+1%, +3%, -1%, -3%) */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500">Quick offsets:</span>
              <button
                type="button"
                onClick={() => handleQuickPercent(1)}
                className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-emerald-400 hover:bg-slate-700"
              >
                +1%
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent(3)}
                className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-emerald-400 hover:bg-slate-700"
              >
                +3%
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent(-1)}
                className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-rose-400 hover:bg-slate-700"
              >
                -1%
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent(-3)}
                className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-rose-400 hover:bg-slate-700"
              >
                -3%
              </button>
            </div>
          </div>

          {/* Custom Note */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
              Custom Label / Strategy Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Resistance breakout, Stop loss, Earnings play"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20"
            >
              <span>Arm Alert</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
