import { getDb, getSetting, cleanupExecutions } from './db';
import { generateHmacSecret } from './auth';
import { loadAllJobs } from './scheduler';

const INIT_FLAG = '__cron_initialized';

function ensureInitialized(): void {
  const g = globalThis as Record<string, unknown>;
  if (g[INIT_FLAG]) return;

  // 1. Initialize database (getDb runs migrations)
  getDb();

  // 2. Ensure HMAC secret exists
  generateHmacSecret();

  // 3. Load all enabled jobs into the scheduler
  loadAllJobs();

  // 4. Set up daily execution cleanup
  setupDailyCleanup();

  // Only set the flag after all initialization succeeds
  g[INIT_FLAG] = true;

  console.log('Cron service initialized');
}

function setupDailyCleanup(): void {
  const g = globalThis as Record<string, unknown>;
  if (g.__cleanupInterval) return;

  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  const runCleanup = () => {
    try {
      const retentionStr = getSetting('retention_days');
      const retentionDays = retentionStr ? parseInt(retentionStr, 10) : 30;
      if (retentionDays > 0) {
        const deleted = cleanupExecutions(retentionDays);
        if (deleted > 0) {
          console.log(
            `Cleanup: deleted ${deleted} executions older than ${retentionDays} days`
          );
        }
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  // Run once at startup
  runCleanup();

  // Then every 24 hours
  g.__cleanupInterval = setInterval(runCleanup, TWENTY_FOUR_HOURS);
}

export { ensureInitialized };
