import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ensureInitialized } from '@/lib/init';
import { listJobs } from '@/lib/db';

export async function GET(request: NextRequest) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const jobs = listJobs();

  const exportData = {
    version: 1,
    exported_at: new Date().toISOString(),
    jobs: jobs.map((job) => ({
      name: job.name,
      url: job.url,
      method: job.method,
      expression: job.expression,
      timezone: job.timezone,
      headers: job.headers,
      body: job.body,
      enabled: job.enabled,
      retries: job.retries,
      retry_interval: job.retry_interval,
      timeout: job.timeout,
      notify_url: job.notify_url,
      notify_email: job.notify_email,
    })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="cron-jobs-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
