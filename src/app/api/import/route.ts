import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ensureInitialized } from '@/lib/init';
import { createJob } from '@/lib/db';
import { addJob } from '@/lib/scheduler';
import type { JobFormData } from '@/lib/types';

interface ImportPayload {
  version: number;
  jobs: JobFormData[];
}

export async function POST(request: NextRequest) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: ImportPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.jobs || !Array.isArray(body.jobs)) {
    return NextResponse.json(
      { error: 'Invalid import format: jobs array required' },
      { status: 400 }
    );
  }

  const imported: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < body.jobs.length; i++) {
    const jobData = body.jobs[i]!;
    try {
      if (!jobData.name || !jobData.url || !jobData.expression) {
        errors.push(`Job ${i}: name, url, and expression are required`);
        continue;
      }

      const formData: JobFormData = {
        name: jobData.name,
        url: jobData.url,
        method: jobData.method || 'GET',
        expression: jobData.expression,
        timezone: jobData.timezone || 'UTC',
        headers: jobData.headers || {},
        body: jobData.body || '',
        enabled: jobData.enabled !== undefined ? jobData.enabled : true,
        retries: jobData.retries || 0,
        retry_interval: jobData.retry_interval || 60,
        timeout: jobData.timeout || 30,
        notify_url: jobData.notify_url || '',
        notify_email: jobData.notify_email || '',
      };

      const job = createJob(formData);
      imported.push(job.id);

      if (job.enabled) {
        addJob({ ...job, enabled: true });
      }
    } catch (err) {
      errors.push(
        `Job ${i} (${jobData.name || 'unnamed'}): ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    imported: imported.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
