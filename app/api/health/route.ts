import { NextResponse } from 'next/server';
import { benchmarkDatabaseSpeed } from '@/lib/db';

export async function GET() {
  const startTime = performance.now();
  let dbHealthy = true;
  let dbBench = {
    readMs: 0,
    writeMs: 0,
    totalRecords: 0,
    journalMode: 'WAL',
    dbPath: '/data/app.db',
  };
  let dbError: string | null = null;

  try {
    dbBench = benchmarkDatabaseSpeed();
  } catch (err: unknown) {
    dbHealthy = false;
    dbError = err instanceof Error ? err.message : 'Database check failed';
  }

  const memory = process.memoryUsage();
  const totalResponseTimeMs = Number((performance.now() - startTime).toFixed(2));

  const responsePayload = {
    status: dbHealthy ? 'ok' : 'degraded',
    next: '16+',
    engine: 'standalone',
    timestamp: new Date().toISOString(),
    uptime_seconds: Number(process.uptime().toFixed(1)),
    response_time_ms: totalResponseTimeMs,
    database: {
      healthy: dbHealthy,
      journal_mode: dbBench.journalMode,
      read_ms: dbBench.readMs,
      write_ms: dbBench.writeMs,
      total_records: dbBench.totalRecords,
      storage_path: dbBench.dbPath,
      error: dbError,
    },
    memory: {
      rss_mb: Number((memory.rss / 1024 / 1024).toFixed(2)),
      heap_total_mb: Number((memory.heapTotal / 1024 / 1024).toFixed(2)),
      heap_used_mb: Number((memory.heapUsed / 1024 / 1024).toFixed(2)),
      external_mb: Number((memory.external / 1024 / 1024).toFixed(2)),
    },
    system: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    },
    orchestration: {
      target: 'vps',
      caddy_tls: 'auto',
      waf: 'coraza-owasp-crs',
      waf_mode: 'enforce',
    },
  };

  return NextResponse.json(responsePayload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'application/json',
    },
  });
}
