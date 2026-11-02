'use client';

import { useActionState } from 'react';
import { createProjectAction, ActionState } from '@/app/projects/actions';
import { PlusCircle, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const initialState: ActionState = {};

export function ProjectForm() {
  const [state, formAction, isPending] = useActionState(createProjectAction, initialState);

  return (
    <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            Provision New Project Record
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tests React 19 <code className="text-cyan-300">useActionState</code> submitting directly to SQLite WAL.
          </p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
          React 19 Action
        </span>
      </div>

      <form action={formAction} className="space-y-4">
        {state.error && (
          <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{state.error}</span>
          </div>
        )}

        {state.success && state.message && (
          <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{state.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-slate-300 mb-1">
              Project Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. NextDeploy Auth Proxy"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="id" className="block text-xs font-medium text-slate-300 mb-1">
              Custom ID (Optional)
            </label>
            <input
              id="id"
              name="id"
              type="text"
              placeholder="e.g. auth-proxy-v1"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="rps" className="block text-xs font-medium text-slate-300 mb-1">
              Simulated RPS
            </label>
            <input
              id="rps"
              name="rps"
              type="number"
              defaultValue={14500}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
            />
          </div>

          <div>
            <label htmlFor="latency" className="block text-xs font-medium text-slate-300 mb-1">
              P99 Latency (ms)
            </label>
            <input
              id="latency"
              name="latency"
              type="number"
              step="0.01"
              defaultValue={1.42}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
            />
          </div>

          <div>
            <label htmlFor="memory" className="block text-xs font-medium text-slate-300 mb-1">
              Memory Footprint (MB)
            </label>
            <input
              id="memory"
              name="memory"
              type="number"
              defaultValue={42}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-xs font-medium text-slate-300 mb-1">
            Deployment Notes
          </label>
          <input
            id="notes"
            name="notes"
            type="text"
            placeholder="e.g. Tested with 50 concurrent worker threads"
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Committing Transaction...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Commit to SQLite WAL
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
