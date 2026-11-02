import Link from 'next/link';
import { 
  Server, 
  ShieldAlert, 
  Database, 
  Cpu, 
  Activity, 
  Zap, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  Terminal,
  FolderGit2
} from 'lucide-react';
import { benchmarkDatabaseSpeed } from '@/lib/db';
import { connection } from 'next/server';

export const instant = false;

export default async function DashboardPage() {
  await connection();
  let dbStatus = {
    ok: true,
    readMs: 0,
    writeMs: 0,
    totalRecords: 0,
    journalMode: 'WAL',
    dbPath: '/data/app.db',
  };

  try {
    const bench = benchmarkDatabaseSpeed();
    dbStatus = {
      ok: true,
      readMs: bench.readMs,
      writeMs: bench.writeMs,
      totalRecords: bench.totalRecords,
      journalMode: bench.journalMode,
      dbPath: bench.dbPath,
    };
  } catch (err: unknown) {
    dbStatus.ok = false;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            NextDeploy VPS Production Rig • Next.js 16 + React 19
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Next.js 16 VPS Kitchen Sink Stress Harness
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Spec-built standalone testbed designed to stress-test NextDeploy deploying to a Linux VPS with
            Docker, Caddy, Coraza OWASP CRS Web Application Firewall, and persistent SQLite WAL volume storage.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20"
            >
              Test Async Actions & Projects
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/waf-verification"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition-all"
            >
              Run Coraza WAF Harness
            </Link>
            <Link
              href="/telemetry"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition-all"
            >
              Open SSE Stream
            </Link>
          </div>
        </div>

        {/* Background decorative glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Core Pillars Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Next.js 16 */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Cpu className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                Active
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Next.js 16 Standalone</h3>
              <p className="text-xs text-slate-400 mt-1">
                React 19 Compiler enabled, dynamicIO, non-root UID 1001 runner.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Node Version</span>
            <span className="text-white font-semibold">{process.version}</span>
          </div>
        </div>

        {/* Pillar 2: SQLite WAL */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                {dbStatus.journalMode.toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Persistent SQLite</h3>
              <p className="text-xs text-slate-400 mt-1">
                WAL mode with 5s busy_timeout mapped to container volume.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Write Latency</span>
            <span className="text-emerald-400 font-semibold">{dbStatus.writeMs} ms</span>
          </div>
        </div>

        {/* Pillar 3: Coraza WAF */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                Enforcing
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Coraza WAF + Caddy</h3>
              <p className="text-xs text-slate-400 mt-1">
                OWASP Core Rule Set (CRS v4) deep packet and query inspection.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Mode</span>
            <span className="text-indigo-300 font-semibold">Strict Enforce</span>
          </div>
        </div>

        {/* Pillar 4: Telemetry SSE */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Activity className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/60">
                1000ms Tick
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Live Telemetry SSE</h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero-buffering ReadableStream pipeline for process stats.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Stream Buffer</span>
            <span className="text-amber-300 font-semibold">X-Accel-Buffering: no</span>
          </div>
        </div>
      </div>

      {/* NextDeploy Topology & Verification Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Architectural Layout */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              NextDeploy VPS Architecture Stack
            </h2>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              nextdeploy.yml verified
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <div className="mt-0.5 p-1.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                <Server className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-200">1. Edge Ingress: Caddy TLS + Coraza WAF</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Terminates TLS automatically and runs all HTTP payloads against the OWASP Core Rule Set. Malicious requests are denied at layer 7 before touching Node.js.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <div className="mt-0.5 p-1.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-200">2. Runtime Container: Node 22 Alpine (Standalone)</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Multi-stage minimal build. Executed by unprivileged <code className="text-cyan-300">nextjs:1001</code> user with native musl libc bindings for high throughput.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <div className="mt-0.5 p-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                <Database className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-200">3. Storage Layer: SQLite WAL on Host Volume</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Host path <code className="text-emerald-300">/var/lib/nextdeploy/vps-v16/data</code> mounted to container <code className="text-emerald-300">/data</code>. Allows zero-downtime container redeployment without data loss.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live SQLite Status */}
        <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Database Engine
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                WAL OK
              </span>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Target Path:</span>
                <span className="text-slate-200 truncate max-w-[180px]">{dbStatus.dbPath}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Read Benchmark:</span>
                <span className="text-cyan-400 font-semibold">{dbStatus.readMs} ms</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Write Benchmark:</span>
                <span className="text-emerald-400 font-semibold">{dbStatus.writeMs} ms</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Total Projects:</span>
                <span className="text-slate-200 font-semibold">{dbStatus.totalRecords}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Busy Timeout:</span>
                <span className="text-slate-200 font-semibold">5000 ms</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/projects"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Manage & Benchmark SQLite Records
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
