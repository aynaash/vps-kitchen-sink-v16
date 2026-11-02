import { NextResponse } from 'next/server';
import { pool } from '@/lib/postgres';
import { benchmarkDatabaseSpeed } from '@/lib/db';

export async function GET() {
  const startTime = performance.now();
  let pgHealthy = true;
  let pgLatencyMs = 0;

  try {
    const pgStart = performance.now();
    await pool.query('SELECT 1');
    pgLatencyMs = Number((performance.now() - pgStart).toFixed(2));
  } catch {
    pgHealthy = false;
  }

  let dbStatus = {
    healthy: true,
    readMs: 0.1,
    writeMs: 0.2,
    journalMode: 'wal',
  };

  try {
    const bench = benchmarkDatabaseSpeed();
    dbStatus = {
      healthy: true,
      readMs: bench.readMs,
      writeMs: bench.writeMs,
      journalMode: bench.journalMode,
    };
  } catch {
    dbStatus.healthy = false;
  }

  const memory = process.memoryUsage();
  const totalResponseTimeMs = Number((performance.now() - startTime).toFixed(2));

  return NextResponse.json(
    {
      status: pgHealthy ? 'ok' : 'degraded',
      next: '16+',
      engine: 'standalone',
      saas: 'PingPulse Uptime & API Health Monitor',
      auth: 'Better Auth (PostgreSQL)',
      timestamp: new Date().toISOString(),
      uptime_seconds: Number(process.uptime().toFixed(1)),
      response_time_ms: totalResponseTimeMs,
      databases: {
        postgres: {
          healthy: pgHealthy,
          latency_ms: pgLatencyMs,
          host: 'localhost:5432',
          db: 'pingpulse',
        },
        sqlite: {
          healthy: dbStatus.healthy,
          journal_mode: dbStatus.journalMode,
          read_ms: dbStatus.readMs,
          write_ms: dbStatus.writeMs,
        },
      },
      memory: {
        rss_mb: Number((memory.rss / 1024 / 1024).toFixed(2)),
        heap_used_mb: Number((memory.heapUsed / 1024 / 1024).toFixed(2)),
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
