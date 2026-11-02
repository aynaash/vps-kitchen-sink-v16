import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface Project {
  id: string;
  name: string;
  metrics: string; // JSON encoded string: { rps: number, latency_p99: number, memory_mb: number, status: string, ... }
  updated_at: number;
}

export interface ParsedProjectMetrics {
  rps?: number;
  latency_p99?: number;
  memory_mb?: number;
  waf_blocked_attacks?: number;
  status?: 'healthy' | 'degraded' | 'stress_testing';
  notes?: string;
  [key: string]: unknown;
}

function resolveDatabasePath(): string {
  // If explicitly specified in environment, honor it
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  // NextDeploy container environment targets /data
  const containerDataDir = '/data';
  try {
    if (fs.existsSync(containerDataDir)) {
      // Test writability
      fs.accessSync(containerDataDir, fs.constants.W_OK);
      return path.join(containerDataDir, 'app.db');
    }
  } catch {
    // Fall through to local workspace directory
  }

  // Local development / fallback directory
  const localDataDir = path.join(process.cwd(), 'data');
  return path.join(localDataDir, 'app.db');
}

const globalForDb = globalThis as unknown as {
  _sqliteDb?: Database.Database;
  _dbPath?: string;
};

export function getDatabase(): Database.Database {
  if (globalForDb._sqliteDb) {
    return globalForDb._sqliteDb;
  }

  const dbPath = resolveDatabasePath();
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? undefined : undefined,
  });

  // Enable WAL mode & busy timeout as per specification
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB memory cache

  // Auto-migrate projects schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      metrics TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);
  `);

  globalForDb._sqliteDb = db;
  globalForDb._dbPath = dbPath;

  seedInitialProjectsIfEmpty(db);

  return db;
}

function seedInitialProjectsIfEmpty(db: Database.Database): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (countRow && countRow.count > 0) {
    return;
  }

  const seedProjects: Array<{ id: string; name: string; metrics: ParsedProjectMetrics }> = [
    {
      id: 'caddy-coraza-crs',
      name: 'Caddy v2 + Coraza OWASP CRS v4',
      metrics: {
        rps: 12450,
        latency_p99: 1.84,
        memory_mb: 48.2,
        waf_blocked_attacks: 842,
        status: 'healthy',
        notes: 'In-line WAF inspection with negligible latency overhead under sustained load.'
      }
    },
    {
      id: 'sqlite-wal-benchmark',
      name: 'Persistent SQLite WAL Stress Rig',
      metrics: {
        rps: 18200,
        latency_p99: 0.62,
        memory_mb: 24.6,
        waf_blocked_attacks: 0,
        status: 'healthy',
        notes: 'Single-writer multi-reader concurrency with zero write lock contention.'
      }
    },
    {
      id: 'nextjs-16-standalone',
      name: 'Next.js 16 Standalone Container',
      metrics: {
        rps: 9800,
        latency_p99: 3.12,
        memory_mb: 88.5,
        waf_blocked_attacks: 12,
        status: 'healthy',
        notes: 'React 19 Server Components with dynamicIO and zero client JS overhead.'
      }
    }
  ];

  const insert = db.prepare(`
    INSERT INTO projects (id, name, metrics, updated_at)
    VALUES (@id, @name, @metrics, @updated_at)
  `);

  const tx = db.transaction(() => {
    const now = Date.now();
    for (const p of seedProjects) {
      insert.run({
        id: p.id,
        name: p.name,
        metrics: JSON.stringify(p.metrics),
        updated_at: now
      });
    }
  });

  tx();
}

// Data access operations
export function getAllProjects(): Project[] {
  const db = getDatabase();
  return db.prepare('SELECT id, name, metrics, updated_at FROM projects ORDER BY updated_at DESC').all() as Project[];
}

export function getProjectById(id: string): Project | undefined {
  const db = getDatabase();
  return db.prepare('SELECT id, name, metrics, updated_at FROM projects WHERE id = ?').get(id) as Project | undefined;
}

export function createProject(data: { id: string; name: string; metrics?: ParsedProjectMetrics }): Project {
  const db = getDatabase();
  const now = Date.now();
  const metricsJson = JSON.stringify(data.metrics || {
    rps: Math.floor(Math.random() * 5000 + 5000),
    latency_p99: Number((Math.random() * 3 + 0.5).toFixed(2)),
    memory_mb: Number((Math.random() * 40 + 30).toFixed(1)),
    status: 'healthy'
  });

  db.prepare(`
    INSERT INTO projects (id, name, metrics, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(data.id, data.name, metricsJson, now);

  return {
    id: data.id,
    name: data.name,
    metrics: metricsJson,
    updated_at: now
  };
}

export function deleteProjectById(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return result.changes > 0;
}

export function benchmarkDatabaseSpeed(): {
  readMs: number;
  writeMs: number;
  totalRecords: number;
  journalMode: string;
  dbPath: string;
} {
  const db = getDatabase();
  const dbPath = globalForDb._dbPath || resolveDatabasePath();

  // Test Write speed with a temporary write transaction
  const tempId = `bench_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const writeStart = performance.now();
  db.prepare(`
    INSERT INTO projects (id, name, metrics, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(tempId, 'Speed Benchmark Probe', JSON.stringify({ rps: 0 }), Date.now());
  const writeMs = Number((performance.now() - writeStart).toFixed(3));

  // Test Read speed
  const readStart = performance.now();
  const readRow = db.prepare('SELECT id, name FROM projects WHERE id = ?').get(tempId);
  const total = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
  const readMs = Number((performance.now() - readStart).toFixed(3));

  // Cleanup benchmark probe
  db.prepare('DELETE FROM projects WHERE id = ?').run(tempId);

  const journalModeRow = db.pragma('journal_mode', { simple: true }) as string;

  return {
    readMs,
    writeMs,
    totalRecords: total - 1,
    journalMode: journalModeRow,
    dbPath
  };
}
