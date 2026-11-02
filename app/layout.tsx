import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Kitchen Sink | Fullstack Next.js 16',
  description: 'Fullstack Next.js 16 application backed by persistent SQLite WAL storage.',
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
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-border/40 py-6 text-xs text-muted-foreground">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>Next.js 16 • React 19 • Tailwind CSS v4 • SQLite WAL</div>
            <div className="font-mono">VPS Ready (/data/app.db)</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
