import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Globe,
  Sun,
  Moon,
  PlusCircle,
  SlidersHorizontal,
  ChevronDown,
  User,
  LogIn,
  LogOut,
  UserPlus,
} from 'lucide-react';
import { ConnectionStatus, MarketMetrics } from '../types/market';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAlertModal: () => void;
  onToggleAlertFeed: () => void;
  onToggleSimulator: () => void;
  connectionStatus: ConnectionStatus;
  metrics: MarketMetrics;
  unreadAlertCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currency: 'IDR' | 'USD';
  onToggleCurrency: () => void;
  onSearchSymbol?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAlertModal,
  onToggleAlertFeed,
  onToggleSimulator,
  connectionStatus,
  metrics,
  unreadAlertCount,
  theme,
  onToggleTheme,
  currency,
  onToggleCurrency,
  onSearchSymbol,
}) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchSymbol?.(e.target.value);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-emerald-500';
      case 'reconnecting':
      case 'connecting':
        return 'bg-amber-500';
      default:
        return 'bg-rose-500';
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-[#0D1322] border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Search Bar matching Reference Design */}
      <div className="flex-1 max-w-md mr-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search market, symbols, funds..."
            className="w-full pl-10 pr-12 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-800 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time WebSocket Telemetry Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor()}`}
            />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusColor()}`} />
          </span>
          <span className="uppercase text-[11px] font-bold tracking-wide">
            {connectionStatus === 'connected' ? 'LIVE' : connectionStatus}
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">
            {metrics.updatesPerSec} ticks/s
          </span>
        </div>

        {/* Currency Switcher */}
        <button
          onClick={onToggleCurrency}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          title="Toggle Currency Display (IDR / USD)"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{currency}</span>
        </button>

        {/* Simulator Drawer Trigger */}
        <button
          onClick={onToggleSimulator}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Market Simulator & Resilience Controls"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Create Alert Quick Button */}
        <button
          onClick={onOpenAlertModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs"
        >
          <PlusCircle className="w-3.5 h-3.5 stroke-[2.4]" />
          <span>Set Alert</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onToggleAlertFeed}
          className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Alert Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* User Profile / Auth Action */}
        {isAuthenticated ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 pl-1 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  Signed In
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {/* Profile Menu Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Account</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Active Session
                  </p>
                </div>

                <div className="p-1.5 space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Switch Account</span>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
