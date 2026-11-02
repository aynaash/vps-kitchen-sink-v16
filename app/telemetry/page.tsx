'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Clock, 
  Play, 
  Pause, 
  Radio
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  const [logs, setLogs] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'paused' | 'disconnected'>('connecting');
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
        const logLine = `[${new Date(payload.timestamp).toISOString().slice(11, 19)}] tick=${payload.tick} rss=${payload.memory.rss_mb}MB heap=${payload.memory.heap_used_mb}/${payload.memory.heap_total_mb}MB uptime=${payload.uptime.toFixed(1)}s`;
        setLogs((prev) => [...prev.slice(-50), logLine]);
        setConnectionStatus('connected');
      } catch (err) {
        console.error('Failed to parse telemetry', err);
      }
    });

    es.onerror = () => {
      setConnectionStatus('disconnected');
    };

    return () => {
      es.close();
    };
  }, [isPaused]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Server Telemetry
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              SSE Stream
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time process memory and server heartbeat streamed via <code className="font-mono text-foreground">/api/telemetry/stream</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="mr-1.5 size-3.5" /> : <Pause className="mr-1.5 size-3.5" />}
            {isPaused ? 'Resume Stream' : 'Pause'}
          </Button>

          <Badge
            variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
            className="capitalize font-mono text-xs"
          >
            {connectionStatus}
          </Badge>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Uptime</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              {data ? formatUptime(data.uptime) : '—'}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-1">
              Tick #{data?.tick || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Heap Used</CardTitle>
            <Cpu className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              {data ? `${data.memory.heap_used_mb} MB` : '—'}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-1">
              of {data?.memory.heap_total_mb || 0} MB Total
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Memory RSS</CardTitle>
            <HardDrive className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              {data ? `${data.memory.rss_mb} MB` : '—'}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-1">
              Resident Set Size
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Runtime Process</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              {data ? `PID ${data.system.pid}` : '—'}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-1">
              {data ? `${data.system.node_version} • ${data.system.platform}` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stream Logs */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Live Event Log</CardTitle>
              <CardDescription className="text-xs">
                Raw events received from the Server-Sent Events stream
              </CardDescription>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              text/event-stream
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={logContainerRef}
            className="h-64 p-3 rounded-md bg-muted/40 border border-border font-mono text-xs overflow-y-auto space-y-1 text-muted-foreground"
          >
            {logs.length === 0 ? (
              <div className="text-muted-foreground/60 italic">Connecting to stream...</div>
            ) : (
              logs.map((log, idx) => <div key={idx}>{log}</div>)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
