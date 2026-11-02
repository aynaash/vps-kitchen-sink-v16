import { pool, initPostgresDatabase } from './postgres';

export interface Monitor {
  id: string;
  user_id: string;
  name: string;
  url: string;
  method: string;
  interval_seconds: number;
  status: 'up' | 'down' | 'pending';
  last_checked_at: Date | null;
  last_status_code: number | null;
  last_latency_ms: number | null;
  uptime_percentage: number;
  created_at: Date;
  updated_at: Date;
}

export interface CheckLog {
  id: string;
  monitor_id: string;
  status_code: number | null;
  latency_ms: number;
  is_up: boolean;
  error_message: string | null;
  created_at: Date;
}

export async function getMonitors(userId?: string): Promise<Monitor[]> {
  await initPostgresDatabase();
  const query = userId
    ? 'SELECT * FROM "monitors" WHERE user_id = $1 ORDER BY created_at DESC'
    : 'SELECT * FROM "monitors" ORDER BY created_at DESC';
  const params = userId ? [userId] : [];
  const res = await pool.query(query, params);
  return res.rows;
}

export async function getMonitorById(id: string): Promise<Monitor | null> {
  await initPostgresDatabase();
  const res = await pool.query('SELECT * FROM "monitors" WHERE id = $1', [id]);
  return res.rows[0] || null;
}

export async function createMonitor(data: {
  userId: string;
  name: string;
  url: string;
  method?: string;
  intervalSeconds?: number;
}): Promise<Monitor> {
  await initPostgresDatabase();
  const id = `mon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const method = data.method || 'GET';
  const intervalSeconds = data.intervalSeconds || 60;

  const res = await pool.query(
    `INSERT INTO "monitors" 
      (id, user_id, name, url, method, interval_seconds, status, uptime_percentage, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', 100.0, NOW(), NOW())
     RETURNING *`,
    [id, data.userId, data.name, data.url, method, intervalSeconds]
  );

  const monitor = res.rows[0];

  // Run initial ping in background
  pingMonitor(monitor.id).catch(() => {});

  return monitor;
}

export async function deleteMonitor(id: string): Promise<boolean> {
  await initPostgresDatabase();
  const res = await pool.query('DELETE FROM "monitors" WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function pingMonitor(id: string): Promise<{
  isUp: boolean;
  statusCode: number | null;
  latencyMs: number;
  errorMessage: string | null;
}> {
  const monitor = await getMonitorById(id);
  if (!monitor) {
    throw new Error('Monitor not found');
  }

  const startTime = performance.now();
  let isUp = false;
  let statusCode: number | null = null;
  let errorMessage: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(monitor.url, {
      method: monitor.method,
      signal: controller.signal,
      headers: {
        'User-Agent': 'PingPulse-Uptime-Bot/1.0',
      },
    });

    clearTimeout(timeout);
    statusCode = res.status;
    isUp = res.status >= 200 && res.status < 400;
    if (!isUp) {
      errorMessage = `HTTP ${res.status} ${res.statusText}`;
    }
  } catch (err: unknown) {
    isUp = false;
    errorMessage = err instanceof Error ? err.message : 'Connection failed';
  }

  const latencyMs = Math.round(performance.now() - startTime);
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Record check log
  await pool.query(
    `INSERT INTO "check_logs" (id, monitor_id, status_code, latency_ms, is_up, error_message, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [logId, id, statusCode, latencyMs, isUp, errorMessage]
  );

  // Recalculate uptime percentage over the last 50 checks
  const statsRes = await pool.query(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN is_up THEN 1 ELSE 0 END) as successful
     FROM (
       SELECT is_up FROM "check_logs"
       WHERE monitor_id = $1
       ORDER BY created_at DESC
       LIMIT 50
     ) sub`,
    [id]
  );

  const total = Number(statsRes.rows[0]?.total || 1);
  const successful = Number(statsRes.rows[0]?.successful || (isUp ? 1 : 0));
  const uptimePercentage = Number(((successful / total) * 100).toFixed(1));

  // Update monitor status
  await pool.query(
    `UPDATE "monitors"
     SET 
       status = $1,
       last_checked_at = NOW(),
       last_status_code = $2,
       last_latency_ms = $3,
       uptime_percentage = $4,
       updated_at = NOW()
     WHERE id = $5`,
    [isUp ? 'up' : 'down', statusCode, latencyMs, uptimePercentage, id]
  );

  return { isUp, statusCode, latencyMs, errorMessage };
}

export async function getMonitorLogs(monitorId: string, limit = 20): Promise<CheckLog[]> {
  await initPostgresDatabase();
  const res = await pool.query(
    `SELECT * FROM "check_logs" WHERE monitor_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [monitorId, limit]
  );
  return res.rows;
}
