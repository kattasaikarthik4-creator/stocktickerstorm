export type FlashState = 'up' | 'down' | null;

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  seq: number;
  timestamp: number;
  sparkline: number[];
  flashState?: FlashState;
  lastUpdated?: number;
}

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface TopMoversPayload {
  gainers: MarketMover[];
  losers: MarketMover[];
  timestamp: number;
  seq: number;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected' | 'connecting';

export interface AlertRule {
  id: string;
  symbol: string;
  condition: 'ABOVE' | 'BELOW';
  targetPrice: number;
  createdAt: number;
  triggered: boolean;
  notes?: string;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  symbol: string;
  condition: 'ABOVE' | 'BELOW';
  targetPrice: number;
  currentPrice: number;
  timestamp: number;
  read: boolean;
}

export interface MarketMetrics {
  updatesPerSec: number;
  totalUpdates: number;
  outgoingMessages: number;
  latencyMs: number;
  lastWatermarkSeq: number;
  droppedPackets: number;
  bufferOccupancy: number;
}

export type ActiveTab = 'watchlist' | 'screener' | 'top_movers';

export interface StreamSnapshotMessage {
  type: 'snapshot';
  stocks: Stock[];
  watermarkSeq: number;
  timestamp: number;
}

export interface TickerUpdateMessage {
  type: 'ticker_update';
  updates: Array<Partial<Stock> & { symbol: string; price: number; seq: number; timestamp?: number }>;
  watermarkSeq: number;
}

export interface TopMoversMessage {
  type: 'top_movers';
  gainers: MarketMover[];
  losers: MarketMover[];
  seq: number;
}

export interface AlertTriggeredMessage {
  type: 'alert_triggered';
  alert: AlertEvent;
}

export interface HeartbeatMessage {
  type: 'heartbeat';
  serverTime: number;
  clientEchoTime?: number;
  watermarkSeq: number;
}

export interface SyncAckMessage {
  type: 'sync_ack';
  syncedUpToSeq: number;
  missedUpdatesCount: number;
}

export type InboundWSMessage =
  | StreamSnapshotMessage
  | TickerUpdateMessage
  | TopMoversMessage
  | AlertTriggeredMessage
  | HeartbeatMessage
  | SyncAckMessage;

export type OutboundWSMessage =
  | { type: 'subscribe'; symbols: string[] }
  | { type: 'unsubscribe'; symbols: string[] }
  | { type: 'sync_request'; fromSeq: number }
  | { type: 'set_alert'; alert: Omit<AlertRule, 'id' | 'createdAt' | 'triggered'> }
  | { type: 'remove_alert'; id: string }
  | { type: 'ping'; timestamp: number }
  | { type: 'configure_simulator'; rate: number; dropRate: number };
