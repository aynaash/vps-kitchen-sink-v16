import Link from 'next/link';
import { 
  FolderKanban, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Activity, 
  ArrowRight,
  Plus,
  Globe
} from 'lucide-react';
import { getAllProjects, benchmarkDatabaseSpeed } from '@/lib/db';
import { connection } from 'next/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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

export const instant = false;

export default async function DashboardPage() {
  await connection();
  const projects = getAllProjects();

  let dbStatus = {
    writeMs: 0.15,
    readMs: 0.08,
  };

  try {
    const bench = benchmarkDatabaseSpeed();
    dbStatus = {
      writeMs: bench.writeMs,
      readMs: bench.readMs,
    };
  } catch {
    // fallback
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Production fullstack Next.js 16 app deployed on Linux VPS with persistent SQLite WAL storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/projects">
              <Plus className="mr-1.5 size-3.5" />
              New Project
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/telemetry">
              <Activity className="mr-1.5 size-3.5" />
              Live Activity
            </Link>
          </Button>
        </div>
      </div>

      {/* Top 4 Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Projects</CardTitle>
            <FolderKanban className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{projects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Stored in SQLite WAL
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Database Latency</CardTitle>
            <Database className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{dbStatus.writeMs}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Read {dbStatus.readMs}ms • Write {dbStatus.writeMs}ms
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Runtime</CardTitle>
            <Cpu className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">Next.js 16</div>
            <p className="text-xs text-muted-foreground mt-1">
              Node 22 LTS • React 19
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Edge WAF</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">Enforce</div>
            <p className="text-xs text-muted-foreground mt-1">
              Coraza OWASP CRS v4
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="shadow-none">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Projects</CardTitle>
            <CardDescription className="text-xs">
              Microservices and fullstack web applications registered in this deployment.
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
            <Link href="/projects">
              View all
              <ArrowRight className="ml-1 size-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">Name</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.slice(0, 5).map((project) => {
                let metrics: { environment?: string; domain?: string } = {};
                try {
                  metrics = JSON.parse(project.metrics);
                } catch {
                  metrics = {};
                }
                const env = metrics.environment || 'production';

                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        <Link href={`/projects/${project.id}`} className="hover:underline">
                          {project.name}
                        </Link>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {project.id}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={env === 'production' ? 'default' : 'secondary'}
                        className="text-[11px] capitalize font-normal"
                      >
                        {env}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                        <Globe className="size-3 text-muted-foreground/70" />
                        <span>{metrics.domain || `${project.id}.example.com`}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                        <Link href={`/projects/${project.id}`}>
                          View
                          <ArrowRight className="ml-1 size-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
