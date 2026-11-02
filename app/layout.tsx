import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Terminal, Shield, HardDrive, Cpu, GitBranch } from 'lucide-react';

export const metadata: Metadata = {
  title: 'vps-kitchen-sink-v16 | NextDeploy VPS Stress Test',
  description:
    'Bleeding-edge Next.js 16+ App Router test harness for NextDeploy on Linux VPS with Docker, Caddy, Coraza WAF, and persistent SQLite WAL.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950/70 text-slate-400 py-6 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5 font-mono text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Node.js 22 LTS (Alpine)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-mono text-slate-300">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                SQLite WAL (/data/app.db)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-mono text-slate-300">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Coraza OWASP CRS
              </span>
            </div>

            <div className="flex items-center space-x-3 text-slate-500 font-mono">
              <span>Next.js 16+ Standalone</span>
              <span>•</span>
              <span>React 19 Compiler</span>
              <span>•</span>
              <span>Tailwind v4</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
