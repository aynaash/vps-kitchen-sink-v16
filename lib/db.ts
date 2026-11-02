import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface Project {
  id: string;
  name: string;
  metrics: string; // JSON encoded string: { domain?: string, environment?: string, status?: string, version?: string, memory_mb?: number, ... }
  updated_at: number;
}

export interface ParsedProjectMetrics {
  domain?: string;
  environment?: 'production' | 'staging' | 'development';
  status?: 'active' | 'deploying' | 'maintenance' | 'paused';
  version?: string;
  memory_mb?: number;
  description?: string;
  [key: string]: unknown;
}

function resolveDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  const containerDataDir = '/data';
  try {
    if (fs.existsSync(containerDataDir)) {
      fs.accessSync(containerDataDir, fs.constants.W_OK);
      return path.join(containerDataDir, 'app.db');
    }
  } catch {
    // Fall back to workspace directory
  }

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

  const db = new Database(dbPath);

  // WAL mode & busy timeout
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');

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
      id: 'web-portal',
      name: 'Customer Web Portal',
      metrics: {
        domain: 'app.example.com',
        environment: 'production',
        status: 'active',
        version: 'v2.4.1',
        memory_mb: 48.2,
        description: 'Next.js 16 frontend app connected to backend services and user authentication.'
      }
    },
    {
      id: 'api-service',
      name: 'Core REST & GraphQL API',
      metrics: {
        domain: 'api.example.com',
        environment: 'production',
        status: 'active',
        version: 'v1.12.0',
        memory_mb: 64.0,
        description: 'Primary business logic and SQLite data persistence layer.'
      }
    },
    {
      id: 'docs-site',
      name: 'Developer Documentation',
      metrics: {
        domain: 'docs.example.com',
        environment: 'staging',
        status: 'active',
        version: 'v1.0.4',
        memory_mb: 32.5,
        description: 'Public documentation and API specifications site.'
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
    status: 'active',
    environment: 'production',
    domain: `${data.id}.example.com`,
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

  const tempId = `bench_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const writeStart = performance.now();
  db.prepare(`
    INSERT INTO projects (id, name, metrics, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(tempId, 'Speed Benchmark Probe', JSON.stringify({ status: 'bench' }), Date.now());
  const writeMs = Number((performance.now() - writeStart).toFixed(3));

  const readStart = performance.now();
  db.prepare('SELECT id, name FROM projects WHERE id = ?').get(tempId);
  const total = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
  const readMs = Number((performance.now() - readStart).toFixed(3));

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
