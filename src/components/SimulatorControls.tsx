import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import {
  Sliders,
  X,
  Zap,
  WifiOff,
  RefreshCw,
  BellRing,
  Gauge,
  Layers,
  Server,
  Play,
  Pause,
} from 'lucide-react';

interface SimulatorControlsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isSimulatorActive,
    toggleSimulator,
    simulatorRate,
    setSimulatorRate,
    simulateDrop,
    metrics,
    wsService,
    createAlertRule,
    stocks,
  } = useMarket();

  const [backendUrl, setBackendUrl] = useState('ws://localhost:8080');
  const [artificialLatency, setArtificialLatency] = useState(0);

  if (!isOpen) return null;

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseInt(e.target.value, 10);
    setSimulatorRate(rate);
  };

  const handleLatencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lat = parseInt(e.target.value, 10);
    setArtificialLatency(lat);
    const sim = wsService.getSimulatorEngine();
    if (sim) {
      sim.setArtificialLatency(lat);
    }
  };

  const handleFireSyntheticAlert = () => {
    const anchor = stocks[0] || { symbol: 'NVDA', price: 140 };
    // Create an alert that triggers immediately by setting target = price
    createAlertRule(anchor.symbol, 'ABOVE', anchor.price, 'Manual Test Trigger');
  };

  const handleSwitchBackend = (e: React.FormEvent) => {
    e.preventDefault();
    wsService.setBackendUrl(backendUrl);
    toggleSimulator(false);
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-sm sm:max-w-md bg-[#090e1a] border-l border-slate-800 shadow-2xl flex flex-col animate-slideLeft">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100">Chaos & Simulator Control</h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Resilience & Load Testing
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

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Source Mode Toggle: Built-in High-Frequency Engine vs Native WS Server */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-3">
          <span className="text-xs font-mono uppercase text-slate-400">
            Data Source Provider
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => toggleSimulator(true)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold gap-1 transition ${
                isSimulatorActive
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>In-Browser HFT Engine</span>
              <span className="text-[10px] font-mono text-slate-500">2,000 Instruments</span>
            </button>

            <button
              onClick={() => toggleSimulator(false)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold gap-1 transition ${
                !isSimulatorActive
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-4 h-4 text-purple-400" />
              <span>Real Node WS Server</span>
              <span className="text-[10px] font-mono text-slate-500">ws://localhost:8080</span>
            </button>
          </div>

          {!isSimulatorActive && (
            <form onSubmit={handleSwitchBackend} className="flex gap-2 mt-1">
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="ws://localhost:8080"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-mono font-semibold text-cyan-300 hover:bg-slate-700"
              >
                Connect
              </button>
            </form>
          )}
        </div>

        {/* High-Frequency Update Rate Slider */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-slate-400">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Throughput Speed</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              {simulatorRate.toLocaleString()} updates/sec
            </span>
          </div>

          <input
            type="range"
            min="20"
            max="3000"
            step="50"
            value={simulatorRate}
            onChange={handleRateChange}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>20 /s (Gentle)</span>
            <span>500 /s (Normal)</span>
            <span>3,000 /s (Stress test)</span>
          </div>
        </div>

        {/* Network Resilience Testing: Drop Connection */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-slate-400">
            <WifiOff className="w-4 h-4 text-rose-400" />
            <span>Connection Drop & Watermark Resync</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Abruptly terminates the connection for 3.5 seconds. Tests automatic exponential backoff reconnection, stream sequence tracking, and snapshot backfill.
          </p>

          <button
            onClick={() => simulateDrop(3500)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold transition"
          >
            <WifiOff className="w-4 h-4" />
            <span>Simulate Abrupt Disconnect (3.5s Drop)</span>
          </button>
        </div>

        {/* Synthetic Latency / Slow Client Simulation */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-slate-400">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Synthetic Network Latency</span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              +{artificialLatency} ms
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="800"
            step="25"
            value={artificialLatency}
            onChange={handleLatencyChange}
            className="w-full accent-amber-500 cursor-pointer"
          />

          <p className="text-[11px] text-slate-400">
            Injects artificial round-trip propagation lag to test slow-client backpressure handling.
          </p>
        </div>

        {/* Test Alert Trigger */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-slate-400">
            <BellRing className="w-4 h-4 text-purple-400" />
            <span>Instant Alert Trigger</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Fires an immediate threshold event to test audio chime, notification feed deduplication, and visual cues.
          </p>

          <button
            onClick={handleFireSyntheticAlert}
            className="flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
          >
            <BellRing className="w-4 h-4" />
            <span>Fire Synthetic Alert Now</span>
          </button>
        </div>

        {/* Live Diagnostics Telemetry Box */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] space-y-1.5 text-slate-400">
          <div className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-1 mb-2">
            DIAGNOSTICS & TELEMETRY
          </div>
          <div className="flex justify-between">
            <span>Watermark Sequence:</span>
            <span className="text-cyan-400">#{metrics.lastWatermarkSeq.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Incoming Updates / Sec:</span>
            <span className="text-emerald-400">{metrics.updatesPerSec}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Ticks Processed:</span>
            <span className="text-slate-200">{metrics.totalUpdates.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Client Outgoing Count:</span>
            <span className="text-purple-400">{metrics.outgoingMessages}</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Network RTT:</span>
            <span className="text-amber-400">{metrics.latencyMs} ms</span>
          </div>
          <div className="flex justify-between">
            <span>Dropped / Stale Packets:</span>
            <span className="text-rose-400">{metrics.droppedPackets}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
