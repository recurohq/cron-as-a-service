import Database from 'better-sqlite3';
import { ulid } from 'ulid';
import type { Execution, Job, JobFormData, Settings } from './types';

const DB_PATH = process.env.DB_PATH || '/data/cron.db';

function getDb(): Database.Database {
  if (!(globalThis as Record<string, unknown>).__db) {
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
    (globalThis as Record<string, unknown>).__db = db;
  }
  return (globalThis as Record<string, unknown>).__db as Database.Database;
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db
      .prepare('SELECT name FROM migrations')
      .all()
      .map((row) => (row as { name: string }).name)
  );

  const migrations: { name: string; sql: string }[] = [
    {
      name: '001_create_jobs',
      sql: `
        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          method TEXT NOT NULL DEFAULT 'GET',
          expression TEXT NOT NULL,
          timezone TEXT NOT NULL DEFAULT 'UTC',
          headers TEXT NOT NULL DEFAULT '{}',
          body TEXT NOT NULL DEFAULT '',
          enabled INTEGER NOT NULL DEFAULT 1,
          retries INTEGER NOT NULL DEFAULT 0,
          retry_interval INTEGER NOT NULL DEFAULT 60,
          timeout INTEGER NOT NULL DEFAULT 30,
          notify_url TEXT NOT NULL DEFAULT '',
          notify_email TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `,
    },
    {
      name: '002_create_executions',
      sql: `
        CREATE TABLE IF NOT EXISTS executions (
          id TEXT PRIMARY KEY,
          job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          status_code INTEGER NOT NULL DEFAULT 0,
          response_body TEXT NOT NULL DEFAULT '',
          latency_ms INTEGER NOT NULL DEFAULT 0,
          error TEXT NOT NULL DEFAULT '',
          attempt INTEGER NOT NULL DEFAULT 1,
          started_at TEXT NOT NULL DEFAULT (datetime('now')),
          finished_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_executions_job_started
          ON executions(job_id, started_at DESC);
      `,
    },
    {
      name: '003_create_settings',
      sql: `
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL DEFAULT ''
        )
      `,
    },
  ];

  const insertMigration = db.prepare(
    'INSERT INTO migrations (name) VALUES (?)'
  );

  for (const migration of migrations) {
    if (!applied.has(migration.name)) {
      db.exec(migration.sql);
      insertMigration.run(migration.name);
    }
  }
}

// ─── Row types for DB results ────────────────────────────────────────

interface JobRow {
  id: string;
  name: string;
  url: string;
  method: string;
  expression: string;
  timezone: string;
  headers: string;
  body: string;
  enabled: number;
  retries: number;
  retry_interval: number;
  timeout: number;
  notify_url: string;
  notify_email: string;
  created_at: string;
  updated_at: string;
}

interface ExecutionRow {
  id: string;
  job_id: string;
  status_code: number;
  response_body: string;
  latency_ms: number;
  error: string;
  attempt: number;
  started_at: string;
  finished_at: string;
}

interface StatsRow {
  job_id: string;
  success: number;
  failure: number;
  total: number;
}

interface LastExecRow {
  job_id: string;
  status_code: number;
  error: string;
}

interface CountRow {
  count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function rowToJob(row: JobRow): Omit<Job, 'next_run' | 'last_status' | 'stats'> {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    method: row.method as Job['method'],
    expression: row.expression,
    timezone: row.timezone,
    headers: JSON.parse(row.headers),
    body: row.body,
    enabled: row.enabled === 1,
    retries: row.retries,
    retry_interval: row.retry_interval,
    timeout: row.timeout,
    notify_url: row.notify_url,
    notify_email: row.notify_email,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToExecution(row: ExecutionRow): Execution {
  return {
    id: row.id,
    job_id: row.job_id,
    status_code: row.status_code,
    response_body: row.response_body,
    latency_ms: row.latency_ms,
    error: row.error,
    attempt: row.attempt,
    started_at: row.started_at,
    finished_at: row.finished_at,
  };
}

// ─── Job CRUD ────────────────────────────────────────────────────────

function createJob(data: JobFormData): Omit<Job, 'next_run' | 'last_status' | 'stats'> {
  const db = getDb();
  const id = ulid();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO jobs (id, name, url, method, expression, timezone, headers, body, enabled, retries, retry_interval, timeout, notify_url, notify_email, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.name,
    data.url,
    data.method,
    data.expression,
    data.timezone,
    JSON.stringify(data.headers),
    data.body,
    data.enabled ? 1 : 0,
    data.retries,
    data.retry_interval,
    data.timeout,
    data.notify_url,
    data.notify_email,
    now,
    now
  );
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as JobRow;
  return rowToJob(row);
}

function getJob(id: string): Omit<Job, 'next_run' | 'last_status' | 'stats'> | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as
    | JobRow
    | undefined;
  return row ? rowToJob(row) : null;
}

function listJobs(): Omit<Job, 'next_run' | 'last_status' | 'stats'>[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all() as JobRow[];
  return rows.map(rowToJob);
}

function updateJob(
  id: string,
  data: Partial<JobFormData>
): Omit<Job, 'next_run' | 'last_status' | 'stats'> | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as
    | JobRow
    | undefined;
  if (!existing) return null;

  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.url !== undefined) {
    fields.push('url = ?');
    values.push(data.url);
  }
  if (data.method !== undefined) {
    fields.push('method = ?');
    values.push(data.method);
  }
  if (data.expression !== undefined) {
    fields.push('expression = ?');
    values.push(data.expression);
  }
  if (data.timezone !== undefined) {
    fields.push('timezone = ?');
    values.push(data.timezone);
  }
  if (data.headers !== undefined) {
    fields.push('headers = ?');
    values.push(JSON.stringify(data.headers));
  }
  if (data.body !== undefined) {
    fields.push('body = ?');
    values.push(data.body);
  }
  if (data.enabled !== undefined) {
    fields.push('enabled = ?');
    values.push(data.enabled ? 1 : 0);
  }
  if (data.retries !== undefined) {
    fields.push('retries = ?');
    values.push(data.retries);
  }
  if (data.retry_interval !== undefined) {
    fields.push('retry_interval = ?');
    values.push(data.retry_interval);
  }
  if (data.timeout !== undefined) {
    fields.push('timeout = ?');
    values.push(data.timeout);
  }
  if (data.notify_url !== undefined) {
    fields.push('notify_url = ?');
    values.push(data.notify_url);
  }
  if (data.notify_email !== undefined) {
    fields.push('notify_email = ?');
    values.push(data.notify_email);
  }

  if (fields.length === 0) {
    return rowToJob(existing);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.prepare(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as JobRow;
  return rowToJob(row);
}

function deleteJob(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
  return result.changes > 0;
}

function toggleJob(id: string, enabled: boolean): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db
    .prepare('UPDATE jobs SET enabled = ?, updated_at = ? WHERE id = ?')
    .run(enabled ? 1 : 0, now, id);
  return result.changes > 0;
}

function deleteBulkJobs(ids: string[]): number {
  const db = getDb();
  const placeholders = ids.map(() => '?').join(', ');
  const result = db
    .prepare(`DELETE FROM jobs WHERE id IN (${placeholders})`)
    .run(...ids);
  return result.changes;
}

function toggleBulkJobs(ids: string[], enabled: boolean): number {
  const db = getDb();
  const now = new Date().toISOString();
  const placeholders = ids.map(() => '?').join(', ');
  const result = db
    .prepare(
      `UPDATE jobs SET enabled = ?, updated_at = ? WHERE id IN (${placeholders})`
    )
    .run(enabled ? 1 : 0, now, ...ids);
  return result.changes;
}

// ─── Executions ──────────────────────────────────────────────────────

function insertExecution(data: {
  job_id: string;
  status_code: number;
  response_body: string;
  latency_ms: number;
  error: string;
  attempt: number;
  started_at: string;
  finished_at: string;
}): Execution {
  const db = getDb();
  const id = ulid();
  db.prepare(
    `INSERT INTO executions (id, job_id, status_code, response_body, latency_ms, error, attempt, started_at, finished_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.job_id,
    data.status_code,
    data.response_body,
    data.latency_ms,
    data.error,
    data.attempt,
    data.started_at,
    data.finished_at
  );
  return {
    id,
    ...data,
  };
}

function listExecutions(
  jobId: string,
  page: number = 1,
  limit: number = 25
): { executions: Execution[]; page: number; limit: number; total: number } {
  const db = getDb();
  const offset = (page - 1) * limit;

  const countRow = db
    .prepare('SELECT COUNT(*) as count FROM executions WHERE job_id = ?')
    .get(jobId) as CountRow;
  const total = countRow.count;

  const rows = db
    .prepare(
      'SELECT * FROM executions WHERE job_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?'
    )
    .all(jobId, limit, offset) as ExecutionRow[];

  return {
    executions: rows.map(rowToExecution),
    page,
    limit,
    total,
  };
}

function getJobStats(jobId: string): { success: number; failure: number; total: number } {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT status_code, error FROM executions
       WHERE job_id = ? AND attempt = 1
       ORDER BY started_at DESC
       LIMIT 50`
    )
    .all(jobId) as { status_code: number; error: string }[];

  let success = 0;
  let failure = 0;
  for (const row of rows) {
    if (row.error || row.status_code >= 400 || row.status_code === 0) {
      failure++;
    } else {
      success++;
    }
  }
  return { success, failure, total: success + failure };
}

function getLastExecution(jobId: string): Execution | null {
  const db = getDb();
  const row = db
    .prepare(
      'SELECT * FROM executions WHERE job_id = ? AND attempt = 1 ORDER BY started_at DESC LIMIT 1'
    )
    .get(jobId) as ExecutionRow | undefined;
  return row ? rowToExecution(row) : null;
}

function cleanupExecutions(retentionDays: number): number {
  const db = getDb();
  const cutoff = new Date(
    Date.now() - retentionDays * 24 * 60 * 60 * 1000
  ).toISOString();
  const result = db
    .prepare('DELETE FROM executions WHERE started_at < ?')
    .run(cutoff);
  return result.changes;
}

function getAllJobStats(): Map<string, { success: number; failure: number; total: number }> {
  const db = getDb();
  const rows = db
    .prepare(
      `WITH ranked AS (
        SELECT job_id, status_code, error,
          ROW_NUMBER() OVER (PARTITION BY job_id ORDER BY started_at DESC) as rn
        FROM executions
        WHERE attempt = 1
      )
      SELECT job_id,
        SUM(CASE WHEN error = '' AND status_code > 0 AND status_code < 400 THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN error != '' OR status_code >= 400 OR status_code = 0 THEN 1 ELSE 0 END) as failure,
        COUNT(*) as total
      FROM ranked
      WHERE rn <= 50
      GROUP BY job_id`
    )
    .all() as StatsRow[];

  const map = new Map<string, { success: number; failure: number; total: number }>();
  for (const row of rows) {
    map.set(row.job_id, {
      success: row.success,
      failure: row.failure,
      total: row.total,
    });
  }
  return map;
}

function getAllLastExecutions(): Map<string, { status_code: number; error: string }> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT e.job_id, e.status_code, e.error
       FROM executions e
       INNER JOIN (
         SELECT job_id, MAX(started_at) as max_started
         FROM executions
         WHERE attempt = 1
         GROUP BY job_id
       ) latest ON e.job_id = latest.job_id AND e.started_at = latest.max_started
       WHERE e.attempt = 1`
    )
    .all() as LastExecRow[];

  const map = new Map<string, { status_code: number; error: string }>();
  for (const row of rows) {
    map.set(row.job_id, {
      status_code: row.status_code,
      error: row.error,
    });
  }
  return map;
}

// ─── Settings ────────────────────────────────────────────────────────

function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row ? row.value : null;
}

function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value);
}

function getAllSettings(): Partial<Settings> {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as {
    key: string;
    value: string;
  }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings as Partial<Settings>;
}

function setMultipleSettings(map: Record<string, string>): void {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const transaction = db.transaction((entries: [string, string][]) => {
    for (const [key, value] of entries) {
      stmt.run(key, value);
    }
  });
  transaction(Object.entries(map));
}

export {
  getDb,
  createJob,
  getJob,
  listJobs,
  updateJob,
  deleteJob,
  toggleJob,
  deleteBulkJobs,
  toggleBulkJobs,
  insertExecution,
  listExecutions,
  getJobStats,
  getLastExecution,
  cleanupExecutions,
  getAllJobStats,
  getAllLastExecutions,
  getSetting,
  setSetting,
  getAllSettings,
  setMultipleSettings,
};
