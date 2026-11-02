'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  Activity, 
  FolderKanban, 
  HeartPulse, 
  Server, 
  Terminal,
  Menu, 
  X,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: Server },
  { href: '/projects', label: 'Projects & Actions', icon: FolderKanban },
  { href: '/telemetry', label: 'Live Telemetry', icon: Activity },
  { href: '/waf-verification', label: 'Coraza WAF', icon: ShieldCheck },
  { href: '/api/health', label: 'Health API', icon: HeartPulse, external: true },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Product Name */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="size-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                v16
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-foreground">
                  VPS Kitchen Sink
                </span>
                <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-border font-normal text-muted-foreground">
                  Next.js 16
                </Badge>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{item.label}</span>
                  {item.external && (
                    <ExternalLink className="size-2.5 text-muted-foreground ml-0.5" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Status Badges */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border text-[11px] font-mono text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SQLite WAL</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border text-[11px] font-mono text-muted-foreground">
              <span className="size-1.5 rounded-full bg-blue-500"></span>
              <span>Coraza WAF</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="size-8"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
