import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Separator } from '@/components/ui/separator';

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
      <body className="min-h-screen bg-background text-foreground flex flex-col antialiased">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-border/40 py-6 text-xs text-muted-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 font-mono">
              <span>Node 22 LTS</span>
              <span>•</span>
              <span>SQLite WAL (/data/app.db)</span>
              <span>•</span>
              <span>Coraza OWASP CRS</span>
            </div>

            <div className="flex items-center space-x-3 font-mono text-muted-foreground/80">
              <span>Next.js 16 Standalone</span>
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
