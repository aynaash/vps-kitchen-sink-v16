import { pool } from '@/lib/postgres';
import { connection } from 'next/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink, CheckCircle2, Database, ShieldCheck, Cpu } from 'lucide-react';

export const instant = false;

export default async function StatusPage() {
  await connection();

  const startPg = performance.now();
  let pgHealthy = true;
  let pgLatencyMs = 0;
  let userCount = 0;
  let monitorCount = 0;

  try {
    const res = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM "users") as users_count,
        (SELECT COUNT(*) FROM "monitors") as monitors_count
    `);
    pgLatencyMs = Math.round(performance.now() - startPg);
    userCount = Number(res.rows[0]?.users_count || 0);
    monitorCount = Number(res.rows[0]?.monitors_count || 0);
  } catch (err) {
    pgHealthy = false;
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
        {/* PostgreSQL Database */}
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Database className="size-4 text-emerald-500" />
                PostgreSQL Database
              </CardTitle>
              <Badge
                variant={pgHealthy ? 'outline' : 'destructive'}
                className="text-xs text-emerald-500 border-emerald-500/30"
              >
                {pgHealthy ? 'Connected' : 'Offline'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Local Docker container running on port 5432
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Database Engine</span>
              <span className="text-foreground">PostgreSQL 16 Alpine</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Port / Host</span>
              <span className="text-foreground">localhost:5432 / pingpulse</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Query Latency</span>
              <span className="text-emerald-500 font-semibold">{pgLatencyMs} ms</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Better Auth Users</span>
              <span className="text-foreground">{userCount}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Active Monitors</span>
              <span className="text-foreground">{monitorCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Node.js Runtime */}
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Cpu className="size-4 text-muted-foreground" />
                Node.js Runtime
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-mono">
                {process.version}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Next.js 16 Standalone Server
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
          NextDeploy Healthcheck endpoint:
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
