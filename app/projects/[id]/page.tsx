import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProjectById, ParsedProjectMetrics } from '@/lib/db';
import { 
  ArrowLeft, 
  Cpu, 
  Database, 
  Shield, 
  Clock, 
  Activity, 
  FileCode2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { connection } from 'next/server';

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

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-xs font-mono text-cyan-400">{project.id}</span>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {project.name}
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-xs font-mono">
                {metrics.status || 'healthy'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Next.js 16 Dynamic Route: <code className="text-cyan-300">/projects/[id]</code> with Promise-based params resolution
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Last touched: {new Date(project.updated_at).toLocaleString()}
          </div>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Peak Throughput
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">
              {metrics.rps?.toLocaleString() || 0} <span className="text-xs text-slate-500">req/s</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              P99 Latency
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
              {metrics.latency_p99 || 0} <span className="text-xs text-slate-500">ms</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              Memory RSS
            </div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-1">
              {metrics.memory_mb || 0} <span className="text-xs text-slate-500">MB</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              WAF Filtered
            </div>
            <div className="text-lg font-bold text-indigo-400 font-mono mt-1">
              {metrics.waf_blocked_attacks || 0} <span className="text-xs text-slate-500">blocked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details & JSON Payload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Specification & SQLite Metadata */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              SQLite Persistent Record Attributes
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              WAL Journal
            </span>
          </div>

          <dl className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <dt className="text-slate-400">Primary Key (id):</dt>
              <dd className="text-cyan-400 font-semibold">{project.id}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <dt className="text-slate-400">Project Name:</dt>
              <dd className="text-slate-200">{project.name}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <dt className="text-slate-400">Raw Unix Timestamp:</dt>
              <dd className="text-slate-300">{project.updated_at}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <dt className="text-slate-400">Async Params Resolution:</dt>
              <dd className="text-emerald-400 font-semibold">OK (Promise resolved)</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-slate-400">Container Path:</dt>
              <dd className="text-slate-300">/data/app.db</dd>
            </div>
          </dl>

          {metrics.notes && (
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 mt-2">
              <span className="font-semibold text-slate-200 block mb-1">Architecture Notes:</span>
              {metrics.notes}
            </div>
          )}
        </div>

        {/* Right: Metrics JSON Payload */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              Parsed Metrics JSON Schema
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              JSON TEXT
            </span>
          </div>

          <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
            {JSON.stringify(metrics, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
