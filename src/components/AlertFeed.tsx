import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import {
  Bell,
  X,
  Trash2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface AlertFeedProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateModal: () => void;
}

export const AlertFeed: React.FC<AlertFeedProps> = ({
  isOpen,
  onClose,
  onOpenCreateModal,
}) => {
  const {
    alertEvents,
    alertRules,
    markAlertRead,
    clearAlertEvents,
    deleteAlertRule,
  } = useMarket();

  const [activeTab, setActiveTab] = useState<'events' | 'rules'>('events');

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-sm sm:max-w-md bg-[#0a101d] border-l border-slate-800 shadow-2xl flex flex-col animate-slideLeft">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100">Alert Center</h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Real-time threshold engine
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* View Selector Tabs */}
      <div className="flex items-center px-4 pt-3 border-b border-slate-800/60 bg-slate-900/20">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 pb-2.5 px-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'events'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Triggered Events</span>
          {alertEvents.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
              {alertEvents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'rules'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Active Rules</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
            {alertRules.length}
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'events' ? (
          <>
            {alertEvents.length > 0 && (
              <div className="flex items-center justify-between pb-1 text-xs">
                <span className="text-slate-500">
                  Deduplicated live alert stream
                </span>
                <button
                  onClick={clearAlertEvents}
                  className="text-slate-400 hover:text-rose-400 transition"
                >
                  Clear all
                </button>
              </div>
            )}

            {alertEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 gap-2">
                <ShieldCheck className="w-10 h-10 text-slate-700" />
                <p className="text-xs">No alerts triggered yet.</p>
                <button
                  onClick={onOpenCreateModal}
                  className="mt-2 text-xs text-emerald-400 hover:underline"
                >
                  Create your first price alert
                </button>
              </div>
            ) : (
              alertEvents.map((event) => {
                const isAbove = event.condition === 'ABOVE';
                return (
                  <div
                    key={event.id}
                    onClick={() => markAlertRead(event.id)}
                    className={`relative p-3 rounded-xl border transition cursor-pointer ${
                      event.read
                        ? 'bg-slate-900/50 border-slate-800/80 text-slate-300'
                        : 'bg-emerald-950/20 border-emerald-500/40 text-slate-100 shadow-lg shadow-emerald-950/30'
                    }`}
                  >
                    {!event.read && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}

                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm text-slate-100">
                        {event.symbol}
                      </span>
                      <span
                        className={`flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isAbove
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isAbove ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        CROSS {event.condition}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between font-mono text-xs mt-2">
                      <span className="text-slate-400">
                        Target: <strong className="text-slate-200">${event.targetPrice.toFixed(2)}</strong>
                      </span>
                      <span className="text-slate-400">
                        Crossed at:{' '}
                        <strong className="text-emerald-400">${event.currentPrice.toFixed(2)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between pb-1 text-xs">
              <span className="text-slate-500">Active Monitoring Rules</span>
              <button
                onClick={onOpenCreateModal}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                + Add Rule
              </button>
            </div>

            {alertRules.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 gap-2">
                <AlertCircle className="w-10 h-10 text-slate-700" />
                <p className="text-xs">No active price alert rules configured.</p>
                <button
                  onClick={onOpenCreateModal}
                  className="mt-2 text-xs text-emerald-400 hover:underline"
                >
                  Arm an alert rule now
                </button>
              </div>
            ) : (
              alertRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-100">
                        {rule.symbol}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          rule.condition === 'ABOVE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {rule.condition} ${rule.targetPrice.toFixed(2)}
                      </span>
                    </div>
                    {rule.notes && (
                      <p className="text-[11px] text-slate-400 mt-1">{rule.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {rule.triggered && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Triggered
                      </span>
                    )}
                    <button
                      onClick={() => deleteAlertRule(rule.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </aside>
  );
};
