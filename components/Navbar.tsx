'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Database, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="size-7 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm">
              <Activity className="size-4 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                PingPulse
              </span>
              <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-emerald-500/30 text-emerald-500 font-normal">
                PostgreSQL + Better Auth
              </Badge>
            </div>
          </Link>

          <nav className="flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pathname === '/' || pathname.startsWith('/monitors')
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monitors
            </Link>
            <Link
              href="/status"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pathname === '/status'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Status
            </Link>
          </nav>
        </div>

        {/* Right side items */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-muted-foreground font-mono">
            <span className="size-1.5 rounded-full bg-emerald-500"></span>
            <span>Docker Postgres :5432</span>
          </div>

          <Button asChild variant="outline" size="sm" className="h-8 text-xs font-mono">
            <Link href="/auth/login">
              <User className="mr-1.5 size-3 text-muted-foreground" />
              <span className="hidden sm:inline">dev@pingpulse.io</span>
              <span className="sm:hidden">Auth</span>
            </Link>
          </Button>

          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link
              href="https://github.com/aynaash/vps-kitchen-sink-v16"
              target="_blank"
              rel="noreferrer"
              title="GitHub Repository"
            >
              <svg className="size-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
