import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProjectById, ParsedProjectMetrics } from '@/lib/db';
import { 
  ArrowLeft, 
  Globe, 
  Clock, 
  Database, 
  Server, 
  ExternalLink 
} from 'lucide-react';
import { connection } from 'next/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export const instant = false;

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  await connection();
  
  // Explicitly testing Next.js 16 Promise-based async params
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  let metrics: ParsedProjectMetrics = {};
  try {
    metrics = JSON.parse(project.metrics);
  } catch {
    metrics = { raw: project.metrics };
  }

  const env = metrics.environment || 'production';

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
          <Link href="/projects">
            <ArrowLeft className="mr-1.5 size-3.5" />
            Projects
          </Link>
        </Button>
        <span>/</span>
        <span className="font-mono text-foreground text-xs">{project.id}</span>
      </div>

      {/* Project Overview Card */}
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <CardTitle className="text-xl font-bold tracking-tight">
                  {project.name}
                </CardTitle>
                <Badge variant={env === 'production' ? 'default' : 'secondary'} className="capitalize text-xs">
                  {env}
                </Badge>
              </div>
              <CardDescription className="text-xs font-mono mt-1">
                {metrics.domain || `${project.id}.example.com`}
              </CardDescription>
            </div>

            <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground/70" />
              Updated {new Date(project.updated_at).toLocaleString()}
            </div>
          </div>
        </CardHeader>

        {metrics.description && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              {metrics.description}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Grid: Properties & JSON */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Project Metadata</CardTitle>
            <CardDescription className="text-xs">
              Persistent columns stored in SQLite table <code className="font-mono text-foreground">projects</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Primary Key (id)</span>
              <span className="text-foreground font-semibold">{project.id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Environment</span>
              <span className="text-foreground capitalize">{env}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Domain</span>
              <span className="text-foreground">{metrics.domain || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Next.js 16 Async Params</span>
              <span className="text-emerald-500 font-semibold">Resolved</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Database Storage</span>
              <span className="text-foreground">/data/app.db (WAL)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Raw Metrics Schema</CardTitle>
            <CardDescription className="text-xs">
              Parsed JSON metadata payload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-3 rounded-md bg-muted/50 border border-border font-mono text-xs overflow-x-auto text-muted-foreground">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
