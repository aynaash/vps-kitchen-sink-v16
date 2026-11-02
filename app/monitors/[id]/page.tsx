import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMonitorById, getMonitorLogs } from '@/lib/monitors';
import { deleteMonitorBoundAction, pingMonitorBoundAction } from '@/app/monitors/actions';
import { 
  ArrowLeft, 
  Globe, 
  Clock, 
  Trash2, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { connection } from 'next/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';

interface MonitorDetailPageProps {
  params: Promise<{ id: string }>;
}

export const instant = false;

export default async function MonitorDetailPage({ params }: MonitorDetailPageProps) {
  await connection();
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const monitor = await getMonitorById(id);

  if (!monitor) {
    notFound();
  }

  const logs = await getMonitorLogs(id, 25);
  const isUp = monitor.status === 'up';

  const boundDelete = async () => {
    'use server';
    await deleteMonitorBoundAction(monitor.id);
  };

  const boundPing = async () => {
    'use server';
    await pingMonitorBoundAction(monitor.id);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
          <Link href="/">
            <ArrowLeft className="mr-1.5 size-3.5" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Monitor Header Card */}
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`size-2.5 rounded-full ${
                    isUp ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <CardTitle className="text-xl font-bold tracking-tight">
                  {monitor.name}
                </CardTitle>
                <Badge variant={isUp ? 'outline' : 'destructive'} className="uppercase font-mono text-xs">
                  {monitor.status}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-mono">
                <span>{monitor.method}</span>
                <span>•</span>
                <a
                  href={monitor.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1 text-foreground"
                >
                  {monitor.url}
                  <ExternalLink className="size-3 text-muted-foreground" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <form action={boundPing}>
                <Button type="submit" variant="outline" size="sm">
                  <RefreshCw className="mr-1.5 size-3.5" />
                  Ping Now
                </Button>
              </form>

              <form action={boundDelete}>
                <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </Button>
              </form>
            </div>
          </div>
        </CardHeader>

        {/* Highlight Stats */}
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-0">
          <div className="p-3 rounded-lg border border-border bg-muted/20">
            <div className="text-xs text-muted-foreground">Uptime</div>
            <div className="text-lg font-bold font-mono text-foreground mt-0.5">
              {monitor.uptime_percentage}%
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/20">
            <div className="text-xs text-muted-foreground">Last Response Time</div>
            <div className="text-lg font-bold font-mono text-foreground mt-0.5">
              {monitor.last_latency_ms ? `${monitor.last_latency_ms} ms` : '—'}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/20">
            <div className="text-xs text-muted-foreground">Status Code</div>
            <div className="text-lg font-bold font-mono text-foreground mt-0.5">
              {monitor.last_status_code ? `HTTP ${monitor.last_status_code}` : '—'}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/20">
            <div className="text-xs text-muted-foreground">Check Interval</div>
            <div className="text-lg font-bold font-mono text-foreground mt-0.5">
              {monitor.interval_seconds}s
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check History Logs Table */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Ping Check History</CardTitle>
          <CardDescription className="text-xs">
            Recent checks recorded in PostgreSQL table <code className="font-mono text-foreground">check_logs</code>
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No ping checks recorded yet. Click &quot;Ping Now&quot; to perform the first check.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>HTTP Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground" suppressHydrationWarning>
                      <span suppressHydrationWarning>
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={log.is_up ? 'outline' : 'destructive'}
                        className="text-[10px] font-mono uppercase py-0 h-4"
                      >
                        {log.is_up ? 'Success' : 'Failed'}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {log.status_code ? `HTTP ${log.status_code}` : 'Connection Refused'}
                    </TableCell>

                    <TableCell className="font-mono text-xs font-semibold">
                      {log.latency_ms} ms
                    </TableCell>

                    <TableCell className="text-right text-xs text-muted-foreground">
                      {log.error_message || 'OK (Responsive)'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
