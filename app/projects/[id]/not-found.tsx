import Link from 'next/link';
import { AlertCircle, ArrowLeft, Database } from 'lucide-react';

export default function ProjectNotFound() {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
      <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-400">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">Project Not Found</h2>
        <p className="text-xs text-slate-400 max-w-md font-mono">
          The requested project ID does not exist in SQLite database at /data/app.db.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Projects Index
        </Link>
      </div>
    </div>
  );
}
