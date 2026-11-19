import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Bookmark,
  Bell,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogIn,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeNav: string;
  onSelectNav: (nav: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  isCollapsed,
  onToggleCollapse,
  unreadCount = 0,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 bg-[#1E1638] dark:bg-[#130E24] text-slate-300 flex flex-col justify-between border-r border-[#2A1F4E] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding Section */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-[#2A1F4E]/60 gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-extrabold shadow-lg flex-shrink-0">
            <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden transition-opacity duration-200">
              <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1">
                Ticker<span className="text-emerald-400">Storm</span>
              </span>
              <span className="text-[10px] uppercase font-semibold text-purple-300/70 tracking-widest block">
                Intelligence
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectNav(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm relative ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-[#2A1F4E]/70'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-slate-950 stroke-[2.2]' : 'text-purple-200/80'}`} />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {/* Badge for Notifications */}
                {Boolean(item.badge && item.badge > 0) && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-slate-950 text-emerald-400'
                        : 'bg-emerald-500 text-slate-950'
                    } ${isCollapsed ? 'absolute top-2 right-2' : ''}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Toggle Section */}
      <div className="p-3 border-t border-[#2A1F4E]/60 space-y-2">
        {/* User Status / Quick Login Button */}
        {!isCollapsed ? (
          isAuthenticated ? (
            <div className="bg-[#2A1F4E]/50 rounded-xl p-2.5 flex items-center gap-2.5 border border-[#3B2D6B]/40">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs min-w-0 flex-1">
                <div className="text-white font-bold truncate">Signed In</div>
                <div className="text-[10px] text-emerald-400">
                  <span>Active Session</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-purple-300 hover:text-white hover:bg-[#2A1F4E]/70"
            title={isAuthenticated ? 'Signed In' : 'Sign In'}
          >
            {isAuthenticated ? <User className="w-5 h-5 text-emerald-400" /> : <LogIn className="w-5 h-5" />}
          </button>
        )}

        {/* Collapsible Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl text-purple-300 hover:text-white hover:bg-[#2A1F4E]/70"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};
