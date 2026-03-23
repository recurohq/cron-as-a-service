import cron from 'node-cron';
import { listJobs } from './db';
import { executeWithRetry } from './executor';
import type { ExecutableJob } from './executor';
import { getNextExecutionTimes } from './cron';

interface SchedulerState {
  tasks: Map<string, cron.ScheduledTask>;
  running: Set<string>;
  concurrency: number;
  queue: (() => void)[];
  activeCount: number;
}

const MAX_CONCURRENCY = 10;

function getScheduler(): SchedulerState {
  const g = globalThis as Record<string, unknown>;
  if (!g.__scheduler) {
    g.__scheduler = {
      tasks: new Map<string, cron.ScheduledTask>(),
      running: new Set<string>(),
      concurrency: MAX_CONCURRENCY,
      queue: [] as (() => void)[],
      activeCount: 0,
    };
  }
  return g.__scheduler as SchedulerState;
}

async function runWithConcurrencyLimit(
  scheduler: SchedulerState,
  fn: () => Promise<void>
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const execute = () => {
      scheduler.activeCount++;
      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          scheduler.activeCount--;
          if (scheduler.queue.length > 0) {
            const next = scheduler.queue.shift()!;
            next();
          }
        });
    };

    if (scheduler.activeCount < scheduler.concurrency) {
      execute();
    } else {
      scheduler.queue.push(execute);
    }
  });
}

function addJob(job: ExecutableJob & { expression: string; timezone: string; enabled: boolean }): void {
  const scheduler = getScheduler();

  // Remove existing task if present
  removeJob(job.id);

  if (!job.enabled) return;

  // Validate cron expression
  if (!cron.validate(job.expression)) {
    console.error(`Invalid cron expression for job ${job.id}: ${job.expression}`);
    return;
  }

  const task = cron.schedule(
    job.expression,
    () => {
      // Overlap prevention: skip if this job is already running
      if (scheduler.running.has(job.id)) {
        return;
      }

      scheduler.running.add(job.id);

      runWithConcurrencyLimit(scheduler, async () => {
        try {
          await executeWithRetry(job);
        } finally {
          scheduler.running.delete(job.id);
        }
      }).catch((err) => {
        console.error(`Job ${job.id} execution error:`, err);
        scheduler.running.delete(job.id);
      });
    },
    {
      timezone: job.timezone || 'UTC',
      scheduled: true,
    }
  );

  scheduler.tasks.set(job.id, task);
}

function removeJob(jobId: string): void {
  const scheduler = getScheduler();
  const existing = scheduler.tasks.get(jobId);
  if (existing) {
    existing.stop();
    scheduler.tasks.delete(jobId);
  }
}

function loadAllJobs(): void {
  const scheduler = getScheduler();

  // Stop all existing tasks
  for (const [, task] of scheduler.tasks) {
    task.stop();
  }
  scheduler.tasks.clear();
  scheduler.running.clear();

  // Load and schedule all enabled jobs
  const jobs = listJobs();
  for (const job of jobs) {
    if (job.enabled) {
      addJob({
        ...job,
        enabled: true,
      });
    }
  }

  console.log(`Scheduler loaded ${jobs.filter((j) => j.enabled).length} enabled jobs`);
}

function submitImmediate(job: ExecutableJob): void {
  const scheduler = getScheduler();

  // No overlap prevention for immediate triggers
  runWithConcurrencyLimit(scheduler, async () => {
    await executeWithRetry(job);
  }).catch((err) => {
    console.error(`Immediate execution error for job ${job.id}:`, err);
  });
}

function getNextRun(expression: string, timezone: string): string {
  const dates = getNextExecutionTimes(expression, timezone, 1);
  if (dates.length > 0) {
    return dates[0]!.toISOString();
  }
  return '';
}

export { getScheduler, addJob, removeJob, loadAllJobs, submitImmediate, getNextRun };
