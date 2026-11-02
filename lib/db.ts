import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface ProjectData {
  description?: string;
  status: 'active' | 'in_progress' | 'completed';
  category?: string;
  [key: string]: unknown;
}

export interface Project {
  id: string;
  name: string;
  metrics: string; // JSON encoded ProjectData
  updated_at: number;
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
    // fallback to local directory
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

  // Auto-migrate schema
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

  const seed: Array<{ id: string; name: string; data: ProjectData }> = [
    {
      id: 'customer-portal',
      name: 'Customer Web Portal',
      data: {
        description: 'Customer facing dashboard for billing and account management.',
        status: 'active',
        category: 'Frontend',
      },
    },
    {
      id: 'core-api',
      name: 'Core REST API',
      data: {
        description: 'High-performance backend API handling authentication and data processing.',
        status: 'active',
        category: 'Backend',
      },
    },
    {
      id: 'analytics-worker',
      name: 'Analytics Worker',
      data: {
        description: 'Background cron job aggregating daily usage metrics and telemetry.',
        status: 'in_progress',
        category: 'Worker',
      },
    },
  ];

  const insert = db.prepare(`
    INSERT INTO projects (id, name, metrics, updated_at)
    VALUES (@id, @name, @metrics, @updated_at)
  `);

  const tx = db.transaction(() => {
    const now = Date.now();
    for (const item of seed) {
      insert.run({
        id: item.id,
        name: item.name,
        metrics: JSON.stringify(item.data),
        updated_at: now,
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

export function createProject(params: { id: string; name: string; data: ProjectData }): Project {
  const db = getDatabase();
  const now = Date.now();
  const metricsJson = JSON.stringify(params.data);

  db.prepare(`
    INSERT INTO projects (id, name, metrics, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(params.id, params.name, metricsJson, now);

  return {
    id: params.id,
    name: params.name,
    metrics: metricsJson,
    updated_at: now,
  };
}

export function toggleProjectStatus(id: string): boolean {
  const db = getDatabase();
  const project = getProjectById(id);
  if (!project) return false;

  let data: ProjectData = { status: 'active' };
  try {
    data = JSON.parse(project.metrics);
  } catch {
    // ignore
  }

  const nextStatus: ProjectData['status'] =
    data.status === 'completed' ? 'active' : 'completed';
  data.status = nextStatus;

  const result = db.prepare(`
    UPDATE projects
    SET metrics = ?, updated_at = ?
    WHERE id = ?
  `).run(JSON.stringify(data), Date.now(), id);

  return result.changes > 0;
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

  const tempId = `bench_${Date.now()}`;
  const writeStart = performance.now();
  db.prepare(`
    INSERT INTO projects (id, name, metrics, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(tempId, 'Benchmark Temp', JSON.stringify({ status: 'active' }), Date.now());
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
    dbPath,
  };
}
