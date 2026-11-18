import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Plus,
  PieChart,
  Shield,
  Layers,
  Sparkles,
  Download,
  Filter,
  PlusCircle,
  X,
  CheckCircle2,
  Sliders,
  Wallet,
} from 'lucide-react';
import { Stock } from '../types/market';
import { Sparkline } from './Sparkline';
import { useAuth } from '../context/AuthContext';

interface PortfolioHolding {
  symbol: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
  category: 'Equities' | 'Crypto' | 'Funds';
}

const INITIAL_HOLDINGS: PortfolioHolding[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', shares: 18, avgBuyPrice: 112.40, category: 'Equities' },
  { symbol: 'AAPL', name: 'Apple Inc.', shares: 12, avgBuyPrice: 198.50, category: 'Equities' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', shares: 6, avgBuyPrice: 395.00, category: 'Equities' },
  { symbol: 'SPY', name: 'S&P 500 Index ETF', shares: 5, avgBuyPrice: 4380.00, category: 'Funds' },
  { symbol: 'BTC', name: 'Bitcoin', shares: 0.045, avgBuyPrice: 58200.00, category: 'Crypto' },
  { symbol: 'LYZ', name: 'Layzoo Ltd.', shares: 10, avgBuyPrice: 128.00, category: 'Equities' },
  { symbol: 'NBL', name: 'NightBlink Ltd.', shares: 10, avgBuyPrice: 104.50, category: 'Equities' },
];

interface PortfolioViewProps {
  stockMap: Map<string, Stock>;
  onSelectStock?: (stock: Stock) => void;
  onOpenAlertModalForStock?: (stock: Stock) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  stockMap,
  onSelectStock,
  onOpenAlertModalForStock,
}) => {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(INITIAL_HOLDINGS);
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Equities' | 'Crypto' | 'Funds'>('All');
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newShares, setNewShares] = useState('10');
  const [newPrice, setNewPrice] = useState('150.00');
  const [newCategory, setNewCategory] = useState<'Equities' | 'Crypto' | 'Funds'>('Equities');
  const [availableCash, setAvailableCash] = useState(3420.00);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('1000');

  // Compute live holding calculations based on real-time prices from WebSocket
  const computedHoldings = holdings.map((h) => {
    const liveStock = stockMap.get(h.symbol);
    const currentPrice = liveStock ? liveStock.price : h.avgBuyPrice * 1.08;
    const totalCurrentValue = h.shares * currentPrice;
    const totalCost = h.shares * h.avgBuyPrice;
    const unrealizedPL = totalCurrentValue - totalCost;
    const unrealizedPLPercent = ((unrealizedPL / totalCost) * 100);
    const dayChangePercent = liveStock ? liveStock.changePercent : 1.4;
    const dayChangeAmount = (totalCurrentValue * dayChangePercent) / 100;

    return {
      ...h,
      currentPrice,
      totalCurrentValue,
      totalCost,
      unrealizedPL,
      unrealizedPLPercent,
      dayChangePercent,
      dayChangeAmount,
      sparkline: liveStock?.sparkline || [h.avgBuyPrice, currentPrice],
    };
  });

  const filteredHoldings = computedHoldings.filter((h) => {
    if (selectedCategory === 'All') return true;
    return h.category === selectedCategory;
  });

  const totalInvestedInAssets = computedHoldings.reduce((sum, h) => sum + h.totalCurrentValue, 0);
  const totalCostBasis = computedHoldings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalNetWorth = totalInvestedInAssets + availableCash;
  const totalAllTimeProfit = totalInvestedInAssets - totalCostBasis;
  const totalAllTimeROI = totalCostBasis > 0 ? (totalAllTimeProfit / totalCostBasis) * 100 : 0;
  const totalDayGain = computedHoldings.reduce((sum, h) => sum + h.dayChangeAmount, 0);
  const totalDayGainPercent = totalInvestedInAssets > 0 ? (totalDayGain / totalInvestedInAssets) * 100 : 0;

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) return;

    const sharesCount = Number(newShares) || 1;
    const buyPrice = Number(newPrice) || 100;

    const existingIndex = holdings.findIndex((h) => h.symbol === sym);
    if (existingIndex >= 0) {
      const updated = [...holdings];
      updated[existingIndex].shares += sharesCount;
      setHoldings(updated);
    } else {
      setHoldings((prev) => [
        {
          symbol: sym,
          name: stockMap.get(sym)?.name || `${sym} Asset`,
          shares: sharesCount,
          avgBuyPrice: buyPrice,
          category: newCategory,
        },
        ...prev,
      ]);
    }

    setIsAddHoldingOpen(false);
    setNewSymbol('');
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(depositAmount) || 0;
    if (amount > 0) {
      setAvailableCash((prev) => prev + amount);
      setIsDepositOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Portfolio Hero & Live Metrics Header */}
      <div className="bg-gradient-to-r from-white via-slate-50 to-white dark:from-[#111827] dark:via-[#131c30] dark:to-[#111827] rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-slate-800 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {user ? `${user.name}'s Active Portfolio` : 'Institutional Portfolio'}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                Live WebSocket Synced
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <h1 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h1>
              <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>+${totalDayGain.toFixed(2)} ({totalDayGainPercent >= 0 ? '+' : ''}{totalDayGainPercent.toFixed(2)}% Today)</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Combined asset equity and cash reserve updated in real-time
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddHoldingOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.4]" />
              <span>+ Add Asset Position</span>
            </button>
            <button
              onClick={() => setIsDepositOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xs"
            >
              <Wallet className="w-4 h-4" />
              <span>Deposit Capital</span>
            </button>
          </div>
        </div>

        {/* Hero 4-Pillar Stat Strips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase block">Invested Capital</span>
            <span className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white font-mono">
              ${totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase block">Unrealized Profit</span>
            <span className="text-lg lg:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              +${totalAllTimeProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase block">All-Time ROI</span>
            <span className="text-lg lg:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              +{totalAllTimeROI.toFixed(2)}%
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase block">Buying Power (Cash)</span>
            <span className="text-lg lg:text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              ${availableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Asset Allocation & Institutional Risk Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Bar */}
        <div className="lg:col-span-8 bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-500" />
                <span>Asset Class Allocation</span>
              </h2>
              <p className="text-xs text-slate-400">Diversification across major security classes</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Balanced Profile
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex mb-4">
            <div className="h-full bg-emerald-500" style={{ width: '54%' }} title="Equities 54%" />
            <div className="h-full bg-amber-500" style={{ width: '22%' }} title="Crypto 22%" />
            <div className="h-full bg-blue-500" style={{ width: '14%' }} title="Funds 14%" />
            <div className="h-full bg-purple-500" style={{ width: '10%' }} title="Cash 10%" />
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">Equities</span>
              </div>
              <div className="font-mono font-bold text-slate-900 dark:text-white">54.2% ($5,487)</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">Crypto</span>
              </div>
              <div className="font-mono font-bold text-slate-900 dark:text-white">22.1% ($2,918)</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">Funds & ETFs</span>
              </div>
              <div className="font-mono font-bold text-slate-900 dark:text-white">14.3% ($1,850)</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">Liquid Cash</span>
              </div>
              <div className="font-mono font-bold text-slate-900 dark:text-white">9.4% ($3,420)</div>
            </div>
          </div>
        </div>

        {/* Risk & Beta Exposure Card */}
        <div className="lg:col-span-4 bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Risk & Factor Exposure</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Real-time portfolio volatility benchmarking against S&P 500
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Portfolio Beta</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">1.08 (Moderate)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Sharpe Ratio</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">2.42 (Optimal)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Annualized Volatility</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">14.6%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Stress-tested for market downturn resilience</span>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Holdings Table */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
        {/* Table Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Active Security Holdings ({computedHoldings.length})
            </h2>
            <p className="text-xs text-slate-400">
              Live market positions with sub-second WebSocket mark-to-market updates
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            {(['All', 'Equities', 'Crypto', 'Funds'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-3">Asset</th>
                <th className="py-3 px-3 text-right">Shares / Qty</th>
                <th className="py-3 px-3 text-right">Avg Buy Price</th>
                <th className="py-3 px-3 text-right">Live Price</th>
                <th className="py-3 px-3 text-right">Position Value</th>
                <th className="py-3 px-3 text-right">24h Gain</th>
                <th className="py-3 px-3 text-right">Total Return</th>
                <th className="py-3 px-3 text-center">Trend (20 Ticks)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredHoldings.map((pos) => {
                const isGain = pos.unrealizedPL >= 0;
                const isDayUp = pos.dayChangePercent >= 0;

                return (
                  <tr
                    key={pos.symbol}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Asset Name & Badge */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                          {pos.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {pos.symbol}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {pos.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Shares Held */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {pos.shares}
                    </td>

                    {/* Avg Buy Price */}
                    <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                      ${pos.avgBuyPrice.toFixed(2)}
                    </td>

                    {/* Live Market Price with Real-time tick */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${pos.currentPrice.toFixed(2)}
                    </td>

                    {/* Total Position Value */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${pos.totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* 24h P&L */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <span className={`inline-flex items-center gap-0.5 font-bold ${isDayUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isDayUp ? '+' : ''}{pos.dayChangePercent.toFixed(2)}%
                      </span>
                    </td>

                    {/* Total Unrealized Return */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <div className={`font-bold ${isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isGain ? '+' : ''}${pos.unrealizedPL.toFixed(2)}
                      </div>
                      <div className={`text-[10px] ${isGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                        ({isGain ? '+' : ''}{pos.unrealizedPLPercent.toFixed(1)}%)
                      </div>
                    </td>

                    {/* Sparkline */}
                    <td className="py-3.5 px-3 text-center w-28">
                      <div className="w-24 h-7 mx-auto">
                        <Sparkline data={pos.sparkline} width={96} height={28} isPositive={isGain} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {isAddHoldingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setIsAddHoldingOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold mb-1">Add Portfolio Position</h3>
            <p className="text-xs text-slate-400 mb-4">Record a new trade or asset holding</p>

            <form onSubmit={handleAddHolding} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Stock / Crypto Symbol
                </label>
                <input
                  type="text"
                  required
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="e.g. TSLA, AMD, GOOGL"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500 uppercase font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Asset Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Equities">Equities / Stocks</option>
                  <option value="Crypto">Cryptocurrency</option>
                  <option value="Funds">Index Funds / ETFs</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Shares / Qty
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newShares}
                    onChange={(e) => setNewShares(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Buy Price ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all text-xs"
              >
                Confirm & Add Position
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Capital Modal */}
      {isDepositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setIsDepositOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold mb-1">Deposit Available Cash</h3>
            <p className="text-xs text-slate-400 mb-4">Add liquidity to your portfolio buying power</p>

            <form onSubmit={handleDeposit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Deposit Amount ($)
                </label>
                <input
                  type="number"
                  step="100"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-md transition-all text-xs"
              >
                Deposit Funds Instantly
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
