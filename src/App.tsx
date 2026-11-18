import React, { useState, useEffect } from 'react';
import { MarketProvider, useMarket } from './context/MarketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Row1Metrics } from './components/Row1Metrics';
import { Row2GrowthAndDistribution } from './components/Row2GrowthAndDistribution';
import { Row3WatchlistAndCrypto } from './components/Row3WatchlistAndCrypto';
import { Row4FundManagers } from './components/Row4FundManagers';
import { Row5FundTables } from './components/Row5FundTables';
import { WatchlistTable } from './components/WatchlistTable';
import { GainersLosersPanel } from './components/GainersLosersPanel';
import { AlertModal } from './components/AlertModal';
import { AlertFeed } from './components/AlertFeed';
import { SimulatorControls } from './components/SimulatorControls';
import { StockDetailModal } from './components/StockDetailModal';
import { AuthModal } from './components/AuthModal';
import { PortfolioView } from './components/PortfolioView';
import { Stock } from './types/market';
import { Bell, X, Shield, User, LogIn, UserPlus, LogOut, CheckCircle } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const {
    stocks,
    stockMap,
    selectedStock,
    setSelectedStock,
    alertEvents,
    markAlertRead,
    connectionStatus,
    metrics,
  } = useMarket();

  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  // Navigation state
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals & Drawers
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [stockForAlert, setStockForAlert] = useState<Stock | null>(null);
  const [isAlertFeedOpen, setIsAlertFeedOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Currency & Theme toggles
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('tickerstorm_theme') as 'light' | 'dark') || 'light';
  });

  // Apply theme to html root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('tickerstorm_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'IDR' ? 'USD' : 'IDR'));
  };

  const handleOpenAlertModalForStock = (stock: Stock) => {
    setStockForAlert(stock);
    setIsAlertModalOpen(true);
  };

  const handleOpenGeneralAlertModal = () => {
    setStockForAlert(null);
    setIsAlertModalOpen(true);
  };

  const latestUnreadAlert = alertEvents.find((e) => !e.read);
  const unreadCount = alertEvents.filter((e) => !e.read).length;

  // Real-time dynamic portfolio calculations based on live market ticks
  const liveSPY = stockMap.get('SPY');
  const liveNVDA = stockMap.get('NVDA');
  const liveBTC = stockMap.get('BTC');

  const deltaMarket = ((liveSPY?.changePercent || 0) * 0.4 + (liveNVDA?.changePercent || 0) * 0.4 + (liveBTC?.changePercent || 0) * 0.2);
  const livePortfolioValuation = Number((10125 * (1 + deltaMarket / 100)).toFixed(2));
  const liveIndexValue = Number((60021.21 * (1 + (liveSPY?.changePercent || 0) / 200)).toFixed(2));
  const liveIndexChangePercent = Number((1.42 + (liveSPY?.changePercent || 0) * 0.2).toFixed(2));
  const liveROI = Number((((livePortfolioValuation - 8032) / 8032) * 100).toFixed(1));

  return (
    <div className="min-h-screen bg-[#F4F6FA] dark:bg-[#070B14] text-slate-800 dark:text-slate-100 flex transition-colors">
      {/* 1. Global Shell: Left Sidebar (Collapsible) */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={(nav) => {
          if (nav === 'notifications') {
            setIsAlertFeedOpen(true);
          } else {
            setActiveNav(nav);
          }
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        unreadCount={unreadCount}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          isSidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* 2. Top Header Bar with Profile & Auth Integration */}
        <Navbar
          onOpenAlertModal={handleOpenGeneralAlertModal}
          onToggleAlertFeed={() => setIsAlertFeedOpen((prev) => !prev)}
          onToggleSimulator={() => setIsSimulatorOpen((prev) => !prev)}
          connectionStatus={connectionStatus}
          metrics={metrics}
          unreadAlertCount={unreadCount}
          theme={theme}
          onToggleTheme={toggleTheme}
          currency={currency}
          onToggleCurrency={toggleCurrency}
          onSearchSymbol={(query) => {
            if (query && query.length >= 2) {
              const matched = stocks.find((s) =>
                s.symbol.toLowerCase().includes(query.toLowerCase()) ||
                s.name.toLowerCase().includes(query.toLowerCase())
              );
              if (matched) {
                // Focus stock or display detail
              }
            }
          }}
        />

        {/* Dashboard Pages */}
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
          {/* Main Financial Intelligence Overview (Default Home) */}
          {activeNav === 'dashboard' && (
            <div>
              {/* Row 1: Top Metric Overview Cards - Dynamic live calculation */}
              <Row1Metrics
                indexValue={liveIndexValue}
                indexChangePercent={liveIndexChangePercent}
                investedCapital={8032}
                currentValuation={livePortfolioValuation}
                roiPercent={liveROI}
              />

              {/* Row 2: Investment Growth & Portfolio Distribution - Dynamic Timeline & Targets */}
              <Row2GrowthAndDistribution livePortfolioValuation={livePortfolioValuation} />

              {/* Row 3: Interactive Stock Watchlists & Crypto Cards */}
              <Row3WatchlistAndCrypto
                stocks={stocks}
                stockMap={stockMap}
                currency={currency}
                onSelectStock={setSelectedStock}
                onOpenAlertModalForStock={handleOpenAlertModalForStock}
              />

              {/* Row 4: Schemes Managed By */}
              <Row4FundManagers />

              {/* Row 5: Detailed Fund Tables */}
              <Row5FundTables />
            </div>
          )}

          {/* Dedicated Institutional Portfolio Management View */}
          {activeNav === 'portfolio' && (
            <PortfolioView
              stockMap={stockMap}
              onSelectStock={setSelectedStock}
              onOpenAlertModalForStock={handleOpenAlertModalForStock}
            />
          )}

          {/* Dedicated Watchlist View */}
          {activeNav === 'watchlist' && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Market Watchlist & Screener
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time 2,000 symbol price feed with sub-millisecond virtualized rendering
                </p>
              </div>
              <WatchlistTable
                mode="watchlist"
                onOpenAlertModalForStock={handleOpenAlertModalForStock}
                onSelectStock={setSelectedStock}
              />
            </div>
          )}

          {/* Dedicated Analytics / Top Movers View */}
          {activeNav === 'analytics' && (
            <div className="space-y-6">
              <GainersLosersPanel
                onOpenAlertModalForStock={handleOpenAlertModalForStock}
                onSelectStock={setSelectedStock}
              />
              <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    High-Volume Market Screener
                  </h2>
                  <p className="text-xs text-slate-400">
                    Comprehensive equity and ETF screener
                  </p>
                </div>
                <WatchlistTable
                  mode="screener"
                  onOpenAlertModalForStock={handleOpenAlertModalForStock}
                  onSelectStock={setSelectedStock}
                />
              </div>
            </div>
          )}

          {/* Settings & User Account Tab */}
          {activeNav === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              {/* Account Card */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      User Profile & Authentication
                    </h2>
                    <p className="text-xs text-slate-400">
                      Manage your TickerStorm account and session
                    </p>
                  </div>
                  {isAuthenticated && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Active Session
                    </span>
                  )}
                </div>

                {isAuthenticated && user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        alt={user.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/40"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                          {user.email}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => openAuthModal('login')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Switch Account</span>
                      </button>
                      <button
                        onClick={() => openAuthModal('register')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-400 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Register New User</span>
                      </button>
                      <button
                        onClick={logout}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-xs font-bold text-rose-600 dark:text-rose-400 transition-colors ml-auto"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700">
                    <User className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Not currently signed in
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-4">
                      Sign in or create an account to save custom alert thresholds and portfolio allocations.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openAuthModal('login')}
                        className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => openAuthModal('register')}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                      >
                        Create Account
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Preferences Card */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Display & Feed Preferences
                </h2>
                <p className="text-xs text-slate-400 mb-6">
                  Configure your real-time WebSocket connection, audio cues, and display preferences
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">Currency Display</div>
                      <div className="text-xs text-slate-400">Toggle between Indonesian Rupiah (Rp) and US Dollars ($)</div>
                    </div>
                    <button
                      onClick={toggleCurrency}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                    >
                      Current: {currency}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">Color Palette</div>
                      <div className="text-xs text-slate-400">Choose between Light surface or Dark mode</div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
                    >
                      {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">Simulator & Resilience</div>
                      <div className="text-xs text-slate-400">Adjust synthetic generation rate up to 5,000 updates/sec</div>
                    </div>
                    <button
                      onClick={() => setIsSimulatorOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs"
                    >
                      Open Drawer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Authentication Modal (Sign In / Registration) */}
      <AuthModal />

      {/* Alert Configuration Modal */}
      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        initialStock={stockForAlert}
      />

      {/* Slide-out Alert Notification Feed Drawer */}
      <AlertFeed
        isOpen={isAlertFeedOpen}
        onClose={() => setIsAlertFeedOpen(false)}
        onOpenCreateModal={handleOpenGeneralAlertModal}
      />

      {/* Slide-out Resilience & Simulator Controls Drawer */}
      <SimulatorControls
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      {/* Stock Quick Detail Modal */}
      <StockDetailModal
        stock={selectedStock}
        onClose={() => setSelectedStock(null)}
        onOpenAlertModal={handleOpenAlertModalForStock}
      />

      {/* Real-time Floating Alert Toast Banner */}
      {latestUnreadAlert && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-[#111827] border border-emerald-500/60 shadow-2xl shadow-emerald-500/10 max-w-sm animate-bounce-subtle">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 animate-ring" />
          </div>

          <div className="flex-1 min-w-0 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <span>{latestUnreadAlert.symbol} Price Alert</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-extrabold">
                ${latestUnreadAlert.targetPrice.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Current Tick: <span className="font-mono font-bold">${latestUnreadAlert.currentPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => markAlertRead(latestUnreadAlert.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MarketProvider>
        <DashboardContent />
      </MarketProvider>
    </AuthProvider>
  );
}
