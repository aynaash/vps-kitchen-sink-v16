'use client';

import { useOptimistic, startTransition } from 'react';
import Link from 'next/link';
import { Project, ParsedProjectMetrics } from '@/lib/db';
import { deleteProjectBoundAction } from '@/app/projects/actions';
import { 
  FolderKanban, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Activity, 
  Zap, 
  Database,
  ArrowUpRight
} from 'lucide-react';

interface ProjectListProps {
  initialProjects: Project[];
}

export function ProjectList({ initialProjects }: ProjectListProps) {
  const [optimisticProjects, removeOptimistic] = useOptimistic(
    initialProjects,
    (currentProjects, idToRemove: string) =>
      currentProjects.filter((p) => p.id !== idToRemove)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            Active Microservice Projects ({optimisticProjects.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            React 19 <code className="text-cyan-300">useOptimistic</code> UI rendering paired with zero-JS bound server actions.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Source: SQLite WAL
        </span>
      </div>

      {optimisticProjects.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
          <Database className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-sm text-slate-400">No project records found in SQLite database.</p>
          <p className="text-xs text-slate-500">Provision a project above to benchmark write transactions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {optimisticProjects.map((project) => {
            let metrics: ParsedProjectMetrics = {};
            try {
              metrics = JSON.parse(project.metrics);
            } catch {
              metrics = {};
            }

            const boundDelete = deleteProjectBoundAction.bind(null, project.id);

            return (
              <div
                key={project.id}
                className="group p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 truncate max-w-[180px]">
                      {project.id}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(project.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white text-base mt-2.5 group-hover:text-cyan-300 transition-colors">
                    <Link href={`/projects/${project.id}`} className="hover:underline flex items-center gap-1">
                      {project.name}
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </h3>

                  {metrics.notes && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {metrics.notes}
                    </p>
                  )}

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 font-mono text-center">
                    <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400">RPS</div>
                      <div className="text-xs font-bold text-cyan-400">
                        {metrics.rps?.toLocaleString() || '—'}
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400">P99</div>
                      <div className="text-xs font-bold text-emerald-400">
                        {metrics.latency_p99 ? `${metrics.latency_p99}ms` : '—'}
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400">RAM</div>
                      <div className="text-xs font-bold text-amber-400">
                        {metrics.memory_mb ? `${metrics.memory_mb}MB` : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    Inspect Async Route
                  </Link>

                  {/* Bound Server Action for deleting projects without client JS overhead */}
                  <form
                    action={async () => {
                      startTransition(() => {
                        removeOptimistic(project.id);
                      });
                      await boundDelete();
                    }}
                  >
                    <button
                      type="submit"
                      title="Bound Server Action Delete (Zero Client JS)"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/60 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
