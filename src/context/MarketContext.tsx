import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Stock,
  MarketMover,
  ConnectionStatus,
  MarketMetrics,
  AlertRule,
  AlertEvent,
  ActiveTab,
  InboundWSMessage,
} from '../types/market';
import { TickerStormWebSocket } from '../services/websocket';
import { soundManager } from '../utils/audio';

const DEFAULT_WATCHLIST = ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD', 'PLTR', 'COIN', 'SMCI', 'LLY', 'NFLX'];

interface MarketContextValue {
  // Navigation & Views
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Data
  stocks: Stock[];
  stockMap: Map<string, Stock>;
  watchlistSymbols: Set<string>;
  toggleWatchlist: (symbol: string) => void;
  isWatchlist: (symbol: string) => boolean;

  // Top Gainers & Losers
  topGainers: MarketMover[];
  topLosers: MarketMover[];

  // Connection & Diagnostics
  connectionStatus: ConnectionStatus;
  metrics: MarketMetrics;
  wsService: TickerStormWebSocket;
  isSimulatorActive: boolean;
  toggleSimulator: (active: boolean) => void;
  simulateDrop: (durationMs?: number) => void;
  setSimulatorRate: (rate: number) => void;
  simulatorRate: number;

  // Alerts
  alertRules: AlertRule[];
  alertEvents: AlertEvent[];
  createAlertRule: (symbol: string, condition: 'ABOVE' | 'BELOW', targetPrice: number, notes?: string) => void;
  deleteAlertRule: (id: string) => void;
  markAlertRead: (id: string) => void;
  clearAlertEvents: () => void;
  unreadAlertCount: number;

  // Selected Stock for Quick Inspect Modal
  selectedStock: Stock | null;
  setSelectedStock: (stock: Stock | null) => void;

  // Screener Controls
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortField: keyof Stock;
  sortDirection: 'asc' | 'desc';
  setSort: (field: keyof Stock) => void;
  filterMode: 'all' | 'gainers' | 'losers';
  setFilterMode: (mode: 'all' | 'gainers' | 'losers') => void;

  // Audio Toggle
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const MarketContext = createContext<MarketContextValue | null>(null);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('watchlist');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const stockMapRef = useRef<Map<string, Stock>>(new Map());

  // RAF High-Frequency Batching Refs
  const dirtySymbolsRef = useRef<Map<string, { price: number; seq: number; timestamp?: number }>>(new Map());
  const rafIdRef = useRef<number | null>(null);
  const flashTimersRef = useRef<Map<string, number>>(new Map());

  // Watchlist State (loaded from localStorage)
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('tickerstorm_watchlist');
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // ignore
    }
    return new Set(DEFAULT_WATCHLIST);
  });

  // Top Movers
  const [topGainers, setTopGainers] = useState<MarketMover[]>([]);
  const [topLosers, setTopLosers] = useState<MarketMover[]>([]);

  // Alerts
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState(true);

  // Connection & Metrics
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [metrics, setMetrics] = useState<MarketMetrics>({
    updatesPerSec: 0,
    totalUpdates: 0,
    outgoingMessages: 0,
    latencyMs: 8,
    lastWatermarkSeq: 0,
    droppedPackets: 0,
    bufferOccupancy: 0,
  });
  const [isSimulatorActive, setIsSimulatorActive] = useState(true);
  const [simulatorRate, setSimulatorRateState] = useState(400);

  // Screener controls
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Stock>('volume');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterMode, setFilterMode] = useState<'all' | 'gainers' | 'losers'>('all');

  // Selected Stock Modal
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // Instantiating WebSocket Service singleton
  const wsRef = useRef<TickerStormWebSocket | null>(null);
  if (!wsRef.current) {
    wsRef.current = new TickerStormWebSocket({
      useSimulator: true,
      url: 'ws://localhost:8080',
    });
  }
  const wsService = wsRef.current;

  // Sound enable/disable
  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    soundManager.setEnabled(enabled);
  }, []);

  // Watchlist storage sync
  useEffect(() => {
    try {
      localStorage.setItem('tickerstorm_watchlist', JSON.stringify(Array.from(watchlistSymbols)));
    } catch {
      // ignore
    }
  }, [watchlistSymbols]);

  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlistSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  }, []);

  const isWatchlist = useCallback(
    (symbol: string) => watchlistSymbols.has(symbol),
    [watchlistSymbols]
  );

  // High-frequency RAF rendering loop
  const scheduleBatchRender = useCallback(() => {
    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (dirtySymbolsRef.current.size === 0) return;

      const dirty = dirtySymbolsRef.current;
      dirtySymbolsRef.current = new Map();
      const currentMap = stockMapRef.current;
      const now = Date.now();

      dirty.forEach((update, symbol) => {
        const existing = currentMap.get(symbol);
        if (!existing) return;

        const oldPrice = existing.price;
        const newPrice = update.price;
        const change = Number((newPrice - existing.previousClose).toFixed(2));
        const changePercent = Number(((change / existing.previousClose) * 100).toFixed(2));
        const high = Math.max(existing.high, newPrice);
        const low = Math.min(existing.low, newPrice);

        // Determine flash animation state
        let flashState: 'up' | 'down' | null = null;
        if (newPrice > oldPrice) flashState = 'up';
        else if (newPrice < oldPrice) flashState = 'down';

        // Keep 20-point sparkline
        const sparkline = [...existing.sparkline];
        sparkline.push(newPrice);
        if (sparkline.length > 20) {
          sparkline.shift();
        }

        const updatedStock: Stock = {
          ...existing,
          price: newPrice,
          change,
          changePercent,
          high,
          low,
          seq: update.seq,
          timestamp: update.timestamp || now,
          sparkline,
          flashState,
          lastUpdated: now,
        };

        currentMap.set(symbol, updatedStock);

        // Schedule clearing of flashState after 750ms
        if (flashState) {
          const oldTimer = flashTimersRef.current.get(symbol);
          if (oldTimer) clearTimeout(oldTimer);

          const timer = window.setTimeout(() => {
            const current = currentMap.get(symbol);
            if (current && current.flashState) {
              currentMap.set(symbol, { ...current, flashState: null });
              // Trigger minor state update
              setStocks((prev) =>
                prev.map((s) => (s.symbol === symbol ? { ...s, flashState: null } : s))
              );
            }
          }, 750);
          flashTimersRef.current.set(symbol, timer);
        }
      });

      // Synchronize with React state
      setStocks(Array.from(currentMap.values()));
    });
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback(
    (msg: InboundWSMessage) => {
      switch (msg.type) {
        case 'snapshot': {
          const map = new Map<string, Stock>();
          msg.stocks.forEach((s) => map.set(s.symbol, s));
          stockMapRef.current = map;
          setStocks(msg.stocks);
          break;
        }

        case 'ticker_update': {
          for (const u of msg.updates) {
            dirtySymbolsRef.current.set(u.symbol, {
              price: u.price,
              seq: u.seq,
              timestamp: u.timestamp,
            });
          }
          scheduleBatchRender();
          break;
        }

        case 'top_movers': {
          setTopGainers(msg.gainers);
          setTopLosers(msg.losers);
          break;
        }

        case 'alert_triggered': {
          soundManager.playAlertChime();
          setAlertEvents((prev) => {
            // Deduplicate alert event by id
            if (prev.some((e) => e.id === msg.alert.id)) return prev;
            return [msg.alert, ...prev.slice(0, 49)]; // keep latest 50
          });
          // Update corresponding rule trigger state
          setAlertRules((prev) =>
            prev.map((r) => (r.id === msg.alert.ruleId ? { ...r, triggered: true } : r))
          );
          break;
        }

        default:
          break;
      }
    },
    [scheduleBatchRender]
  );

  // Initialize and attach listeners
  useEffect(() => {
    const unsubMsg = wsService.onMessage(handleMessage);
    const unsubStatus = wsService.onStatusChange(setConnectionStatus);
    const unsubMetrics = wsService.onMetrics(setMetrics);

    wsService.connect();

    return () => {
      unsubMsg();
      unsubStatus();
      unsubMetrics();
      wsService.disconnect(true);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [wsService, handleMessage]);

  // Simulator controls
  const toggleSimulator = useCallback(
    (active: boolean) => {
      setIsSimulatorActive(active);
      wsService.setUseSimulator(active);
    },
    [wsService]
  );

  const simulateDrop = useCallback(
    (durationMs = 3000) => {
      const sim = wsService.getSimulatorEngine();
      if (sim) {
        sim.simulateConnectionDrop(durationMs);
      } else {
        wsService.disconnect(false);
        setTimeout(() => wsService.connect(), durationMs);
      }
    },
    [wsService]
  );

  const setSimulatorRate = useCallback(
    (rate: number) => {
      setSimulatorRateState(rate);
      const sim = wsService.getSimulatorEngine();
      if (sim) {
        sim.setRate(rate);
      }
    },
    [wsService]
  );

  // Alert management
  const createAlertRule = useCallback(
    (symbol: string, condition: 'ABOVE' | 'BELOW', targetPrice: number, notes?: string) => {
      const newRule: AlertRule = {
        id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        symbol,
        condition,
        targetPrice,
        createdAt: Date.now(),
        triggered: false,
        notes,
      };

      setAlertRules((prev) => [newRule, ...prev]);

      // Inform backend/simulator
      wsService.send({
        type: 'set_alert',
        alert: {
          symbol,
          condition,
          targetPrice,
          notes,
        },
      });

      const sim = wsService.getSimulatorEngine();
      if (sim) {
        sim.registerAlertRule(newRule);
      }
    },
    [wsService]
  );

  const deleteAlertRule = useCallback(
    (id: string) => {
      setAlertRules((prev) => prev.filter((r) => r.id !== id));
      wsService.send({ type: 'remove_alert', id });
      const sim = wsService.getSimulatorEngine();
      if (sim) {
        sim.removeAlertRule(id);
      }
    },
    [wsService]
  );

  const markAlertRead = useCallback((id: string) => {
    setAlertEvents((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)));
  }, []);

  const clearAlertEvents = useCallback(() => {
    setAlertEvents([]);
  }, []);

  const unreadAlertCount = useMemo(
    () => alertEvents.filter((e) => !e.read).length,
    [alertEvents]
  );

  // Sort toggler
  const setSort = useCallback((field: keyof Stock) => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortDirection('desc');
      return field;
    });
  }, []);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      stocks,
      stockMap: stockMapRef.current,
      watchlistSymbols,
      toggleWatchlist,
      isWatchlist,
      topGainers,
      topLosers,
      connectionStatus,
      metrics,
      wsService,
      isSimulatorActive,
      toggleSimulator,
      simulateDrop,
      setSimulatorRate,
      simulatorRate,
      alertRules,
      alertEvents,
      createAlertRule,
      deleteAlertRule,
      markAlertRead,
      clearAlertEvents,
      unreadAlertCount,
      selectedStock,
      setSelectedStock,
      searchQuery,
      setSearchQuery,
      sortField,
      sortDirection,
      setSort,
      filterMode,
      setFilterMode,
      soundEnabled,
      setSoundEnabled,
    }),
    [
      activeTab,
      stocks,
      watchlistSymbols,
      toggleWatchlist,
      isWatchlist,
      topGainers,
      topLosers,
      connectionStatus,
      metrics,
      wsService,
      isSimulatorActive,
      toggleSimulator,
      simulateDrop,
      setSimulatorRate,
      simulatorRate,
      alertRules,
      alertEvents,
      createAlertRule,
      deleteAlertRule,
      markAlertRead,
      clearAlertEvents,
      unreadAlertCount,
      selectedStock,
      searchQuery,
      sortField,
      sortDirection,
      setSort,
      filterMode,
      soundEnabled,
      setSoundEnabled,
    ]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
};

export const useMarket = () => {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used within a MarketProvider');
  return ctx;
};
