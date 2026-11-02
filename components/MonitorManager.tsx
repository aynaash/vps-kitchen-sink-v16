'use client';

import { useOptimistic, useActionState, startTransition, useState } from 'react';
import Link from 'next/link';
import { Monitor } from '@/lib/monitors';
import { 
  createMonitorAction, 
  deleteMonitorBoundAction, 
  pingMonitorBoundAction,
  ActionState 
} from '@/app/monitors/actions';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Activity, 
  Globe, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Zap,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';

interface MonitorManagerProps {
  initialMonitors: Monitor[];
}

export function MonitorManager({ initialMonitors }: MonitorManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [pingingId, setPingingId] = useState<string | null>(null);

  const [formState, formAction, isCreating] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const res = await createMonitorAction(prev, formData);
      if (res.success) {
        setShowAdd(false);
      }
      return res;
    },
    {}
  );

  const [optimisticMonitors, setOptimistic] = useOptimistic(
    initialMonitors,
    (state, idToRemove: string) => state.filter((m) => m.id !== idToRemove)
  );

  const total = optimisticMonitors.length;
  const upCount = optimisticMonitors.filter((m) => m.status === 'up').length;
  const downCount = optimisticMonitors.filter((m) => m.status === 'down').length;
  const avgLatency =
    total > 0
      ? Math.round(
          optimisticMonitors.reduce((acc, m) => acc + (m.last_latency_ms || 0), 0) / total
        )
      : 0;

  const handlePing = async (id: string) => {
    setPingingId(id);
    try {
      await pingMonitorBoundAction(id);
    } finally {
      setPingingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* SaaS Metric Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Monitored Services</CardTitle>
            <Globe className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{total}</div>
            <p className="text-xs text-muted-foreground mt-0.5">PostgreSQL persistent</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">System Health</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-500">
              {total > 0 ? `${Math.round((upCount / total) * 100)}%` : '100%'}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{upCount} operational</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Response Time</CardTitle>
            <Zap className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{avgLatency} ms</div>
            <p className="text-xs text-muted-foreground mt-0.5">Across all endpoints</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Incidents</CardTitle>
            <AlertCircle className={`size-4 ${downCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${downCount > 0 ? 'text-destructive' : ''}`}>
              {downCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{downCount > 0 ? 'Action needed' : 'All systems green'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Endpoints</h2>
          <p className="text-xs text-muted-foreground">
            Monitors automatically ping your servers and record response latencies in PostgreSQL.
          </p>
        </div>

        <Button
          onClick={() => setShowAdd(!showAdd)}
          size="sm"
        >
          <Plus className="mr-1.5 size-4" />
          {showAdd ? 'Cancel' : 'Add Monitor'}
        </Button>
      </div>

      {/* Add Monitor Form */}
      {showAdd && (
        <Card className="shadow-none border-dashed bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">New Uptime Monitor</CardTitle>
            <CardDescription className="text-xs">
              Enter target API or website URL to begin periodic health checks.
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4">
              {formState.error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  {formState.error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-medium text-foreground">
                    Friendly Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. Production Billing API"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="url" className="text-xs font-medium text-foreground">
                    Target URL *
                  </label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    required
                    placeholder="https://api.example.com/health"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="method" className="text-xs font-medium text-foreground">
                    HTTP Method
                  </label>
                  <select
                    id="method"
                    name="method"
                    defaultValue="GET"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="GET">GET</option>
                    <option value="HEAD">HEAD</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="interval" className="text-xs font-medium text-foreground">
                    Check Interval
                  </label>
                  <select
                    id="interval"
                    name="interval"
                    defaultValue="60"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="30">Every 30 seconds</option>
                    <option value="60">Every 60 seconds (Standard)</option>
                    <option value="300">Every 5 minutes</option>
                  </select>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} size="sm">
                {isCreating ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Creating Monitor...
                  </>
                ) : (
                  'Start Monitoring'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Monitors Table */}
      <Card className="shadow-none">
        <CardContent className="p-0">
          {optimisticMonitors.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No monitors configured yet. Click &quot;Add Monitor&quot; above to track your first endpoint.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead className="hidden md:table-cell">Last Checked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {optimisticMonitors.map((m) => {
                  const isUp = m.status === 'up';
                  const isPinging = pingingId === m.id;
                  const boundDelete = deleteMonitorBoundAction.bind(null, m.id);

                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          <Link href={`/monitors/${m.id}`} className="hover:underline">
                            {m.name}
                          </Link>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground truncate max-w-[220px]">
                          {m.url}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${
                              isUp
                                ? 'bg-emerald-500 animate-pulse'
                                : m.status === 'down'
                                ? 'bg-red-500'
                                : 'bg-muted-foreground'
                            }`}
                          />
                          <Badge
                            variant={isUp ? 'outline' : m.status === 'down' ? 'destructive' : 'secondary'}
                            className="text-[11px] uppercase font-mono py-0 h-4"
                          >
                            {m.status}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        {m.last_latency_ms ? (
                          <span className={m.last_latency_ms < 150 ? 'text-emerald-500' : 'text-foreground'}>
                            {m.last_latency_ms} ms
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-xs font-medium">
                        {m.uptime_percentage}%
                      </TableCell>

                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                        {m.last_checked_at
                          ? new Date(m.last_checked_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : 'Pending'}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPinging}
                            onClick={() => handlePing(m.id)}
                            className="h-8 px-2 text-xs"
                            title="Ping now"
                          >
                            <RefreshCw className={`size-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline ml-1.5">Check</span>
                          </Button>

                          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                            <Link href={`/monitors/${m.id}`}>
                              Logs
                              <ArrowUpRight className="ml-1 size-3 text-muted-foreground" />
                            </Link>
                          </Button>

                          <form
                            action={async () => {
                              startTransition(() => {
                                setOptimistic(m.id);
                              });
                              await boundDelete();
                            }}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              title="Delete monitor"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
