import React from 'react';
import { useMarket } from '../context/MarketContext';
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Sliders,
  Bell,
  Volume2,
  VolumeX,
  PlusCircle,
  Flame,
  LineChart,
  ListFilter,
} from 'lucide-react';
import { ActiveTab } from '../types/market';

interface HeaderProps {
  onOpenAlertModal: () => void;
  onToggleAlertFeed: () => void;
  onToggleSimulator: () => void;
  isAlertFeedOpen: boolean;
  isSimulatorOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAlertModal,
  onToggleAlertFeed,
  onToggleSimulator,
  isAlertFeedOpen,
  isSimulatorOpen,
}) => {
  const {
    activeTab,
    setActiveTab,
    connectionStatus,
    metrics,
    unreadAlertCount,
    soundEnabled,
    setSoundEnabled,
    watchlistSymbols,
  } = useMarket();

  // Status Badge Styling
  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            <Wifi className="w-3.5 h-3.5" />
            <span>CONNECTED</span>
          </div>
        );
      case 'reconnecting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>RECONNECTING...</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>CONNECTING</span>
          </div>
        );
      case 'disconnected':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-medium">
            <WifiOff className="w-3.5 h-3.5" />
            <span>DISCONNECTED</span>
          </div>
        );
    }
  };

  const navTabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }> = [
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: <LineChart className="w-4 h-4" />,
      badge: watchlistSymbols.size,
    },
    {
      id: 'screener',
      label: 'Market Screener',
      icon: <ListFilter className="w-4 h-4" />,
      badge: '2,000',
    },
    {
      id: 'top_movers',
      label: 'Top Gainers & Losers',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      badge: 'Live',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#0c121e]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Connection Status */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-extrabold text-base">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white font-mono">
                  Ticker<span className="text-emerald-400">Storm</span>
                </span>
                <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  v2.4-HFT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Sub-Millisecond Financial Stream Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Live Metrics Telemetry Bar */}
        <div className="hidden xl:flex items-center gap-3 text-xs font-mono bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-500">Rate:</span>
            <span className="font-semibold text-emerald-400">
              {metrics.updatesPerSec.toLocaleString()} <span className="text-[10px] text-slate-400">msg/s</span>
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">Watermark:</span>
            <span className="font-semibold text-cyan-400">
              #{metrics.lastWatermarkSeq.toLocaleString()}
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">RTT:</span>
            <span className={`font-semibold ${metrics.latencyMs > 50 ? 'text-amber-400' : 'text-slate-300'}`}>
              {metrics.latencyMs} ms
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">Out:</span>
            <span className="font-semibold text-purple-400">
              {metrics.outgoingMessages.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* New Alert Button */}
          <button
            onClick={onOpenAlertModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-semibold transition"
            title="Create Price Threshold Alert"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Set Alert</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs transition ${
              soundEnabled
                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Mute Alert Chimes' : 'Unmute Alert Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Alert Center Trigger */}
          <button
            onClick={onToggleAlertFeed}
            className={`relative p-2 rounded-lg border text-xs transition ${
              isAlertFeedOpen
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle Live Alert Feed"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg animate-bounce">
                {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
              </span>
            )}
          </button>

          {/* Simulator & Resilience Controls Drawer Trigger */}
          <button
            onClick={onToggleSimulator}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              isSimulatorOpen
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Resilience & High-Frequency Simulator Controls"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chaos & Sim</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center justify-between border-t border-slate-800/60 mt-2.5 pt-2">
        <nav className="flex items-center gap-1 sm:gap-2">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile quick metrics */}
        <div className="xl:hidden flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>{metrics.updatesPerSec} msg/s</span>
        </div>
      </div>
    </header>
  );
};
