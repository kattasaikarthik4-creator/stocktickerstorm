import {
  ConnectionStatus,
  InboundWSMessage,
  OutboundWSMessage,
  MarketMetrics
} from '../types/market';
import { MockWebSocketEngine } from './mockServer';

export interface WebSocketServiceConfig {
  url?: string;
  useSimulator?: boolean;
  maxReconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
  pingIntervalMs?: number;
}

export class TickerStormWebSocket {
  private config: Required<WebSocketServiceConfig>;
  private socket: WebSocket | null = null;
  private simulator: MockWebSocketEngine | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private lastPingSentTime = 0;

  private outgoingQueue: OutboundWSMessage[] = [];
  private lastWatermarkSeq = 0;

  // Real-time Metrics Tracking
  private updateCountWindow = 0;
  private totalUpdates = 0;
  private outgoingCount = 0;
  private droppedPackets = 0;
  private latencyMs = 0;
  private updatesPerSec = 0;
  private metricsTimer: number | null = null;

  // Listeners
  private messageListeners: Set<(msg: InboundWSMessage) => void> = new Set();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private metricsListeners: Set<(metrics: MarketMetrics) => void> = new Set();

  constructor(config: WebSocketServiceConfig = {}) {
    this.config = {
      url: config.url || 'ws://localhost:8080',
      useSimulator: config.useSimulator !== undefined ? config.useSimulator : true,
      maxReconnectAttempts: config.maxReconnectAttempts || 15,
      initialReconnectDelay: config.initialReconnectDelay || 1000,
      maxReconnectDelay: config.maxReconnectDelay || 8000,
      pingIntervalMs: config.pingIntervalMs || 3000,
    };

    this.startMetricsLoop();
  }

  public connect() {
    this.disconnect(false);

    if (this.config.useSimulator) {
      this.initSimulator();
    } else {
      this.initRealWebSocket();
    }
  }

  public disconnect(permanent = true) {
    if (permanent) {
      this.clearReconnectTimer();
      this.clearPingTimer();
    }

    if (this.socket) {
      // Avoid firing onclose handler for manual teardown
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      try {
        this.socket.close();
      } catch {
        // ignore
      }
      this.socket = null;
    }

    if (this.simulator) {
      this.simulator.stop();
      this.simulator = null;
    }

    this.updateStatus('disconnected');
  }

  public setUseSimulator(useSim: boolean) {
    if (this.config.useSimulator === useSim) return;
    this.config.useSimulator = useSim;
    this.connect();
  }

  public setBackendUrl(url: string) {
    this.config.url = url;
    if (!this.config.useSimulator) {
      this.connect();
    }
  }

  public getSimulatorEngine(): MockWebSocketEngine | null {
    return this.simulator;
  }

  public send(msg: OutboundWSMessage) {
    this.outgoingCount++;

    if (this.config.useSimulator && this.simulator) {
      this.simulator.handleClientMessage(JSON.stringify(msg));
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(msg));
      } catch {
        this.outgoingQueue.push(msg);
      }
    } else {
      // Queue message for delivery when reconnected
      if (this.outgoingQueue.length < 500) {
        this.outgoingQueue.push(msg);
      } else {
        this.droppedPackets++;
      }
    }
  }

  public onMessage(callback: (msg: InboundWSMessage) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  public onMetrics(callback: (metrics: MarketMetrics) => void): () => void {
    this.metricsListeners.add(callback);
    return () => this.metricsListeners.delete(callback);
  }

  public getLastWatermark(): number {
    return this.lastWatermarkSeq;
  }

  // --- Private Implementations ---

  private initSimulator() {
    this.updateStatus('connecting');
    this.simulator = new MockWebSocketEngine(2000);

    this.simulator.setCallbacks(
      (msg) => this.handleIncomingMessage(msg),
      (status) => this.updateStatus(status)
    );

    // Short artificial delay to mirror network handshake
    setTimeout(() => {
      if (this.simulator && this.config.useSimulator) {
        this.simulator.start();
        this.flushOutgoingQueue();
      }
    }, 150);
  }

  private initRealWebSocket() {
    this.updateStatus('connecting');
    try {
      this.socket = new WebSocket(this.config.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
      this.startPingLoop();

      // If we have a sequence watermark, request backfill
      if (this.lastWatermarkSeq > 0) {
        this.send({
          type: 'sync_request',
          fromSeq: this.lastWatermarkSeq,
        });
      }

      this.flushOutgoingQueue();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as InboundWSMessage;
        this.handleIncomingMessage(data);
      } catch {
        this.droppedPackets++;
      }
    };

    this.socket.onerror = () => {
      // socket.onclose will be called right after
    };

    this.socket.onclose = () => {
      this.clearPingTimer();
      this.updateStatus('disconnected');
      this.scheduleReconnect();
    };
  }

  private handleIncomingMessage(msg: InboundWSMessage) {
    // Record metrics
    if (msg.type === 'ticker_update') {
      const count = msg.updates?.length || 1;
      this.updateCountWindow += count;
      this.totalUpdates += count;
      if (msg.watermarkSeq) {
        this.lastWatermarkSeq = Math.max(this.lastWatermarkSeq, msg.watermarkSeq);
      }
    } else if (msg.type === 'snapshot') {
      this.updateCountWindow += msg.stocks.length;
      this.totalUpdates += msg.stocks.length;
      if (msg.watermarkSeq) {
        this.lastWatermarkSeq = msg.watermarkSeq;
      }
    } else if (msg.type === 'heartbeat') {
      if (msg.clientEchoTime) {
        this.latencyMs = Math.max(1, Date.now() - msg.clientEchoTime);
      }
      if (msg.watermarkSeq) {
        this.lastWatermarkSeq = Math.max(this.lastWatermarkSeq, msg.watermarkSeq);
      }
    }

    // Broadcast to listeners
    this.messageListeners.forEach((listener) => {
      try {
        listener(msg);
      } catch {
        // Safe isolation
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) return;
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.updateStatus('disconnected');
      return;
    }

    this.updateStatus('reconnecting');
    this.reconnectAttempts++;

    // Exponential backoff with random jitter: delay = min(maxDelay, base * 1.5^(attempt) + jitter)
    const factor = Math.pow(1.5, this.reconnectAttempts);
    const jitter = Math.random() * 400;
    const delay = Math.min(
      this.config.maxReconnectDelay,
      this.config.initialReconnectDelay * factor + jitter
    );

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.config.useSimulator) {
        this.initRealWebSocket();
      }
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startPingLoop() {
    this.clearPingTimer();
    this.pingTimer = window.setInterval(() => {
      if (this.status === 'connected') {
        this.lastPingSentTime = Date.now();
        this.send({ type: 'ping', timestamp: this.lastPingSentTime });
      }
    }, this.config.pingIntervalMs);
  }

  private clearPingTimer() {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private flushOutgoingQueue() {
    if (this.outgoingQueue.length === 0) return;
    const queued = [...this.outgoingQueue];
    this.outgoingQueue = [];
    queued.forEach((msg) => this.send(msg));
  }

  private updateStatus(newStatus: ConnectionStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach((fn) => fn(newStatus));
  }

  private startMetricsLoop() {
    this.metricsTimer = window.setInterval(() => {
      this.updatesPerSec = this.updateCountWindow;
      this.updateCountWindow = 0;

      const metrics: MarketMetrics = {
        updatesPerSec: this.updatesPerSec,
        totalUpdates: this.totalUpdates,
        outgoingMessages: this.outgoingCount,
        latencyMs: this.latencyMs,
        lastWatermarkSeq: this.lastWatermarkSeq,
        droppedPackets: this.droppedPackets,
        bufferOccupancy: this.outgoingQueue.length,
      };

      this.metricsListeners.forEach((fn) => fn(metrics));
    }, 1000);
  }

  public destroy() {
    this.disconnect(true);
    if (this.metricsTimer !== null) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }
    this.messageListeners.clear();
    this.statusListeners.clear();
    this.metricsListeners.clear();
  }
}
