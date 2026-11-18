import React, { useMemo } from 'react';
import { useMarket } from '../context/MarketContext';
import { Stock } from '../types/market';
import { useVirtualScroll } from '../hooks/useVirtualScroll';
import { Sparkline } from './Sparkline';
import {
  Star,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
  Search,
  BellPlus,
  SlidersHorizontal,
  X,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface WatchlistTableProps {
  mode: 'watchlist' | 'screener';
  onOpenAlertModalForStock: (stock: Stock) => void;
  onSelectStock: (stock: Stock) => void;
}

export const WatchlistTable: React.FC<WatchlistTableProps> = ({
  mode,
  onOpenAlertModalForStock,
  onSelectStock,
}) => {
  const {
    stocks,
    watchlistSymbols,
    toggleWatchlist,
    isWatchlist,
    searchQuery,
    setSearchQuery,
    sortField,
    sortDirection,
    setSort,
    filterMode,
    setFilterMode,
  } = useMarket();

  // Filter and Sort dataset
  const filteredAndSortedStocks = useMemo(() => {
    let result = stocks;

    // 1. Mode filter: Watchlist vs Screener
    if (mode === 'watchlist') {
      result = result.filter((s) => watchlistSymbols.has(s.symbol));
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      );
    }

    // 3. Direction filter (gainers / losers)
    if (filterMode === 'gainers') {
      result = result.filter((s) => s.changePercent > 0);
    } else if (filterMode === 'losers') {
      result = result.filter((s) => s.changePercent < 0);
    }

    // 4. Sort
    return [...result].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        const comp = valA.localeCompare(valB);
        return sortDirection === 'asc' ? comp : -comp;
      }

      const numA = (valA as number) ?? 0;
      const numB = (valB as number) ?? 0;
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
  }, [stocks, mode, watchlistSymbols, searchQuery, filterMode, sortField, sortDirection]);

  // Virtualization Hook: 52px row height with 8 row overscan
  const { containerRef, visibleItems, totalHeight, offsetY } = useVirtualScroll<Stock>({
    items: filteredAndSortedStocks,
    itemHeight: 52,
    overscan: 10,
  });

  const renderSortIndicator = (field: keyof Stock) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return (
      <span className="text-emerald-400 font-bold text-xs">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[#0d1424] border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-slate-900/60 border-b border-slate-800/80">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              mode === 'watchlist'
                ? 'Filter your watchlist symbols...'
                : 'Search 2,000+ symbols, tech, pharma, energy...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-950/70 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters and Stats */}
        <div className="flex items-center gap-2">
          {/* Quick Filter: All / Gainers / Losers */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('gainers')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition ${
                filterMode === 'gainers'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Gainers
            </button>
            <button
              onClick={() => setFilterMode('losers')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition ${
                filterMode === 'losers'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <TrendingDown className="w-3 h-3 text-rose-400" />
              Losers
            </button>
          </div>

          {/* Row Count Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>
              Showing <strong className="text-slate-200">{filteredAndSortedStocks.length.toLocaleString()}</strong> rows
            </span>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#0a0f1c] border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400 select-none">
        <div className="col-span-1 flex items-center justify-center">
          <span>Pin</span>
        </div>

        <div
          onClick={() => setSort('symbol')}
          className="col-span-3 sm:col-span-2 flex items-center gap-1 cursor-pointer group hover:text-slate-200 transition"
        >
          <span>Symbol / Co.</span>
          {renderSortIndicator('symbol')}
        </div>

        <div
          onClick={() => setSort('price')}
          className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1 cursor-pointer group hover:text-slate-200 transition"
        >
          <span>Price ($)</span>
          {renderSortIndicator('price')}
        </div>

        <div
          onClick={() => setSort('changePercent')}
          className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1 cursor-pointer group hover:text-slate-200 transition"
        >
          <span>24h Change</span>
          {renderSortIndicator('changePercent')}
        </div>

        <div className="col-span-2 hidden md:flex items-center justify-center">
          <span>Trend (20 Ticks)</span>
        </div>

        <div
          onClick={() => setSort('volume')}
          className="col-span-2 hidden lg:flex items-center justify-end gap-1 cursor-pointer group hover:text-slate-200 transition"
        >
          <span>Volume</span>
          {renderSortIndicator('volume')}
        </div>

        <div
          onClick={() => setSort('seq')}
          className="col-span-1 hidden xl:flex items-center justify-center gap-1 cursor-pointer group hover:text-slate-200 transition"
        >
          <span>Seq #</span>
          {renderSortIndicator('seq')}
        </div>

        <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
          <span>Alert</span>
        </div>
      </div>

      {/* Virtualized Table Scroll Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative divide-y divide-slate-800/40"
      >
        {filteredAndSortedStocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
            <Search className="w-8 h-8 text-slate-600" />
            <p className="text-sm">No symbols match your active filters.</p>
            {mode === 'watchlist' && (
              <p className="text-xs text-slate-400">
                Switch to the Market Screener tab and star symbols to populate your watchlist!
              </p>
            )}
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${offsetY}px)`,
              }}
            >
              {visibleItems.map(({ item: stock }) => {
                const isPos = stock.changePercent >= 0;
                const inWatchlist = isWatchlist(stock.symbol);

                // Row Flash Animation Classes
                let flashClass = '';
                if (stock.flashState === 'up') {
                  flashClass = 'bg-emerald-500/20 text-emerald-300 transition-colors duration-200';
                } else if (stock.flashState === 'down') {
                  flashClass = 'bg-rose-500/20 text-rose-300 transition-colors duration-200';
                }

                return (
                  <div
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock)}
                    className={`grid grid-cols-12 gap-2 px-4 h-[52px] items-center cursor-pointer select-none border-b border-slate-800/40 hover:bg-slate-800/50 transition-colors ${flashClass}`}
                  >
                    {/* Watchlist Star Toggle */}
                    <div
                      className="col-span-1 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(stock.symbol);
                      }}
                    >
                      <button
                        className="p-1 rounded hover:bg-slate-700/60 transition"
                        title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        <Star
                          className={`w-4 h-4 transition ${
                            inWatchlist
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600 hover:text-slate-400'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Symbol & Name */}
                    <div className="col-span-3 sm:col-span-2 flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {stock.symbol}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate">
                        {stock.name}
                      </span>
                    </div>

                    {/* Price with subtle flash pill */}
                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end font-mono font-semibold text-sm">
                      <span
                        className={`px-1.5 py-0.5 rounded transition ${
                          stock.flashState === 'up'
                            ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                            : stock.flashState === 'down'
                            ? 'bg-rose-500/30 text-rose-300 font-bold'
                            : 'text-slate-100'
                        }`}
                      >
                        ${stock.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Change $ and % */}
                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end">
                      <div
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium ${
                          isPos
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isPos ? (
                          <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />
                        )}
                        <span>
                          {isPos ? '+' : ''}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Sparkline */}
                    <div className="col-span-2 hidden md:flex items-center justify-center">
                      <Sparkline
                        data={stock.sparkline}
                        width={95}
                        height={26}
                        isPositive={isPos}
                      />
                    </div>

                    {/* Volume */}
                    <div className="col-span-2 hidden lg:flex items-center justify-end font-mono text-xs text-slate-400">
                      {stock.volume >= 1000000
                        ? `${(stock.volume / 1000000).toFixed(2)}M`
                        : `${(stock.volume / 1000).toFixed(0)}K`}
                    </div>

                    {/* Sequence Number */}
                    <div className="col-span-1 hidden xl:flex items-center justify-center font-mono text-[11px] text-cyan-400/80">
                      #{stock.seq}
                    </div>

                    {/* Quick Alert Trigger */}
                    <div
                      className="col-span-2 sm:col-span-1 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAlertModalForStock(stock);
                      }}
                    >
                      <button
                        className="p-1.5 rounded-md bg-slate-800/80 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700/60 hover:border-emerald-500/40 transition"
                        title={`Set Price Alert for ${stock.symbol}`}
                      >
                        <BellPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
