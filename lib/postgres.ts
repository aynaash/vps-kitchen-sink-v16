import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pingpulse';

const globalForPg = globalThis as unknown as {
  _pgPool?: Pool;
};

export const pool =
  globalForPg._pgPool ||
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg._pgPool = pool;
}

export async function initPostgresDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "monitors" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "method" TEXT NOT NULL DEFAULT 'GET',
        "interval_seconds" INTEGER NOT NULL DEFAULT 60,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "last_checked_at" TIMESTAMP,
        "last_status_code" INTEGER,
        "last_latency_ms" INTEGER,
        "uptime_percentage" REAL NOT NULL DEFAULT 100.0,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_monitors_user_id ON "monitors"("user_id");

      CREATE TABLE IF NOT EXISTS "check_logs" (
        "id" TEXT PRIMARY KEY,
        "monitor_id" TEXT NOT NULL REFERENCES "monitors"("id") ON DELETE CASCADE,
        "status_code" INTEGER,
        "latency_ms" INTEGER NOT NULL,
        "is_up" BOOLEAN NOT NULL,
        "error_message" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_check_logs_monitor ON "check_logs"("monitor_id", "created_at" DESC);
    `);
  } finally {
    client.release();
  }
}
