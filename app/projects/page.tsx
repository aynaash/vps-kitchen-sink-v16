import { getAllProjects } from '@/lib/db';
import { ProjectForm } from '@/components/ProjectForm';
import { ProjectList } from '@/components/ProjectList';
import { connection } from 'next/server';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';

export const instant = false;

export default async function ProjectsPage() {
  await connection();
  const projects = getAllProjects();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Projects & Concurrency State
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              React 19 Actions
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Demonstrates React 19 Server Components reading directly from local SQLite WAL, React 19{' '}
            <code className="font-mono text-foreground">useActionState</code> form mutations, optimistic client rendering, and zero-JS bound server actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs py-1">
            <Database className="mr-1.5 size-3 text-muted-foreground" />
            SQLite WAL
          </Badge>
        </div>
      </div>

      {/* Creation Form */}
      <ProjectForm />

      {/* Project Grid */}
      <ProjectList initialProjects={projects} />
    </div>
  );
}
