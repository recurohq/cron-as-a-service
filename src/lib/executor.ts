import { insertExecution } from './db';
import { notifyFailure } from './notification';
import type { Execution } from './types';

interface ExecutableJob {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timeout: number;
  retries: number;
  retry_interval: number;
  notify_url: string;
  notify_email: string;
}

const MAX_RESPONSE_SIZE = 10 * 1024; // 10KB

async function executeJob(
  job: ExecutableJob,
  attempt: number = 1
): Promise<Execution> {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  let statusCode = 0;
  let responseBody = '';
  let error = '';

  try {
    const controller = new AbortController();
    const timeoutMs = (job.timeout || 30) * 1000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const fetchOptions: RequestInit = {
      method: job.method,
      headers: job.headers || {},
      signal: controller.signal,
    };

    // Only attach body for methods that support it
    if (
      job.body &&
      job.method !== 'GET' &&
      job.method !== 'DELETE'
    ) {
      fetchOptions.body = job.body;
    }

    const response = await fetch(job.url, fetchOptions);
    clearTimeout(timeoutId);

    statusCode = response.status;

    // Read response body, limiting to MAX_RESPONSE_SIZE
    const reader = response.body?.getReader();
    if (reader) {
      const chunks: Uint8Array[] = [];
      let totalSize = 0;
      let done = false;

      while (!done && totalSize < MAX_RESPONSE_SIZE) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          chunks.push(result.value);
          totalSize += result.value.length;
        }
      }

      reader.cancel().catch(() => {});
      const decoder = new TextDecoder();
      responseBody = chunks.map((c) => decoder.decode(c, { stream: true })).join('');
      if (responseBody.length > MAX_RESPONSE_SIZE) {
        responseBody = responseBody.slice(0, MAX_RESPONSE_SIZE);
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        error = `Timeout after ${job.timeout}s`;
      } else {
        error = err.message;
      }
    } else {
      error = String(err);
    }
  }

  const finishedAt = new Date().toISOString();
  const latencyMs = Date.now() - startMs;

  const execution = insertExecution({
    job_id: job.id,
    status_code: statusCode,
    response_body: responseBody,
    latency_ms: latencyMs,
    error,
    attempt,
    started_at: startedAt,
    finished_at: finishedAt,
  });

  return execution;
}

function isRetryableResult(execution: Execution): boolean {
  // Retry on: connection error (status 0 + error), timeout, 5xx
  if (execution.error) return true;
  if (execution.status_code >= 500) return true;
  // Don't retry 2xx, 3xx, 4xx
  return false;
}

async function executeWithRetry(job: ExecutableJob): Promise<void> {
  const maxAttempts = (job.retries || 0) + 1;
  let lastExecution: Execution | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      // Exponential backoff: retry_interval doubles each attempt
      const delayMs =
        (job.retry_interval || 60) * 1000 * Math.pow(2, attempt - 2);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const execution = await executeJob(job, attempt);
    lastExecution = execution;

    // If success or non-retryable, stop
    if (!isRetryableResult(execution)) {
      return;
    }
  }

  // All retries exhausted and still failing, fire notification
  if (lastExecution && isRetryableResult(lastExecution)) {
    await notifyFailure(job, lastExecution);
  }
}

export { executeJob, executeWithRetry };
export type { ExecutableJob };
