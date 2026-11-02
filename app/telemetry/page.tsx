'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Clock, 
  Terminal, 
  Play, 
  Pause, 
  RefreshCw, 
  Radio, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface TelemetryData {
  tick: number;
  timestamp: number;
  uptime: number;
  memory: {
    rss_mb: number;
    heap_total_mb: number;
    heap_used_mb: number;
    external_mb: number;
  };
  system: {
    node_version: string;
    arch: string;
    platform: string;
    pid: number;
  };
  status: string;
}

export default function TelemetryPage() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<TelemetryData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'paused'>('connecting');
  const [isPaused, setIsPaused] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnectionStatus('paused');
      return;
    }

    setConnectionStatus('connecting');
    const es = new EventSource('/api/telemetry/stream');
    eventSourceRef.current = es;

    es.addEventListener('telemetry', (event) => {
      try {
        const payload: TelemetryData = JSON.parse(event.data);
        setData(payload);
        setHistory((prev) => [...prev.slice(-40), payload]);
        setConnectionStatus('connected');
      } catch (err) {
        console.error('Failed to parse telemetry event', err);
      }
    });

    es.onerror = () => {
      setConnectionStatus('disconnected');
    };

    return () => {
      es.close();
    };
  }, [isPaused]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [history]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ''}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono mb-2">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            Continuous ReadableStream SSE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Real-Time System Telemetry Stream
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Streams continuous process memory, Node.js runtime metrics, and event ticks every 1000ms.
            Configured with <code className="text-cyan-300">X-Accel-Buffering: no</code> to test Caddy reverse proxy streaming without latency buffers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isPaused
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900/80'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Resume SSE' : 'Pause Stream'}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : connectionStatus === 'paused'
                  ? 'bg-slate-500'
                  : 'bg-red-400'
              }`}
            />
            <span className="capitalize text-slate-300">{connectionStatus}</span>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Uptime</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {data ? formatUptime(data.uptime) : '—'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Tick #{data?.tick || 0}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Heap Used</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {data ? `${data.memory.heap_used_mb}` : '—'}{' '}
            <span className="text-xs text-slate-500">MB</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            of {data?.memory.heap_total_mb || 0} MB Total
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Memory RSS</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {data ? `${data.memory.rss_mb}` : '—'}{' '}
            <span className="text-xs text-slate-500">MB</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Resident Set Size
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Runtime Host</span>
            <Terminal className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-base font-bold font-mono text-indigo-300 truncate">
            {data ? `PID ${data.system.pid}` : '—'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            {data ? `${data.system.platform} (${data.system.arch})` : '—'}
          </div>
        </div>
      </div>

      {/* Heap Memory Visual Sparkline */}
      <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Live Heap Memory Pressure (Last 40 Ticks)</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {data ? `${data.memory.heap_used_mb} MB / ${data.memory.heap_total_mb} MB` : ''}
          </span>
        </div>

        <div className="h-28 flex items-end gap-1.5 pt-4 px-2 bg-slate-950/70 rounded-lg border border-slate-800/80">
          {history.map((item, idx) => {
            const pct = Math.min(100, Math.max(10, (item.memory.heap_used_mb / (item.memory.heap_total_mb || 100)) * 100));
            return (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-cyan-600/40 to-cyan-400 rounded-t transition-all duration-300 relative group"
                style={{ height: `${pct}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-[10px] font-mono text-cyan-300 rounded border border-slate-700 pointer-events-none whitespace-nowrap z-20">
                  {item.memory.heap_used_mb} MB (Tick #{item.tick})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live SSE Raw Stream Log Output */}
      <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Server-Sent Event Console Stream</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            HTTP/1.1 200 text/event-stream
          </span>
        </div>

        <div
          ref={logContainerRef}
          className="h-64 p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-y-auto space-y-1.5"
        >
          {history.length === 0 ? (
            <div className="text-slate-600 italic">Waiting for initial SSE frame from /api/telemetry/stream...</div>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-400 hover:text-slate-200">
                <span className="text-slate-600 select-none">[{new Date(item.timestamp).toISOString().slice(11, 23)}]</span>
                <span className="text-cyan-400">tick={item.tick}</span>
                <span className="text-emerald-400">rss={item.memory.rss_mb}MB</span>
                <span className="text-amber-400">heap={item.memory.heap_used_mb}/{item.memory.heap_total_mb}MB</span>
                <span className="text-slate-500">uptime={item.uptime.toFixed(1)}s</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
