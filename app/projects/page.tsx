import { getAllProjects } from '@/lib/db';
import { ProjectForm } from '@/components/ProjectForm';
import { ProjectList } from '@/components/ProjectList';
import { Database, Zap, RefreshCw } from 'lucide-react';
import { connection } from 'next/server';

export const instant = false;

export default async function ProjectsPage() {
  await connection();
  const projects = getAllProjects();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono mb-2">
            <Zap className="w-3 h-3" />
            Testing Async Request & Action State
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Projects & Concurrency State
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Demonstrates React 19 Server Components reading directly from local SQLite WAL, React 19{' '}
            <code className="text-cyan-300">useActionState</code> form mutations, optimistic client rendering, and zero-JS bound server actions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>SQLite WAL</span>
          </div>
        </div>
      </div>

      {/* Creation Form */}
      <ProjectForm />

      {/* Project Grid */}
      <ProjectList initialProjects={projects} />
    </div>
  );
}
