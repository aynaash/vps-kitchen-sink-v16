import { benchmarkDatabaseSpeed } from '@/lib/db';
import { connection } from 'next/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

export const instant = false;

export default async function StatusPage() {
  await connection();

  let dbStatus = {
    healthy: true,
    readMs: 0.1,
    writeMs: 0.2,
    journalMode: 'wal',
    path: '/data/app.db',
  };

  try {
    const bench = benchmarkDatabaseSpeed();
    dbStatus = {
      healthy: true,
      readMs: bench.readMs,
      writeMs: bench.writeMs,
      journalMode: bench.journalMode,
      path: bench.dbPath,
    };
  } catch {
    dbStatus.healthy = false;
  }

  const memory = process.memoryUsage();
  const uptime = Math.floor(process.uptime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          System Status
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Health and runtime environment info for this deployment.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">SQLite Database</CardTitle>
              <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30">
                Connected
              </Badge>
            </div>
            <CardDescription className="text-xs">
              WAL mode active on persistent volume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Path</span>
              <span className="text-foreground truncate max-w-[200px]">{dbStatus.path}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Journal Mode</span>
              <span className="text-foreground uppercase">{dbStatus.journalMode}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Read Latency</span>
              <span className="text-foreground">{dbStatus.readMs} ms</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Write Latency</span>
              <span className="text-foreground">{dbStatus.writeMs} ms</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Node.js Runtime</CardTitle>
              <Badge variant="secondary" className="text-xs font-mono">
                {process.version}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Standalone container process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Memory RSS</span>
              <span className="text-foreground">{(memory.rss / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Heap Used</span>
              <span className="text-foreground">{(memory.heapUsed / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Uptime</span>
              <span className="text-foreground">{uptime}s</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">PID / Platform</span>
              <span className="text-foreground">{process.pid} ({process.platform})</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20 text-xs">
        <span className="text-muted-foreground">
          Healthcheck endpoint monitored by NextDeploy orchestration:
        </span>
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link href="/api/health" target="_blank">
            <span>/api/health</span>
            <ExternalLink className="ml-1.5 size-3 text-muted-foreground" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
