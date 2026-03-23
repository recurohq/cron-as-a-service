import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ensureInitialized } from '@/lib/init';
import {
  listJobs,
  createJob,
  getAllJobStats,
  getAllLastExecutions,
} from '@/lib/db';
import { addJob, getNextRun } from '@/lib/scheduler';
import type { Job, JobFormData, JobStatus } from '@/lib/types';

function computeLastStatus(
  job: { enabled: boolean },
  lastExec: { status_code: number; error: string } | undefined
): JobStatus {
  if (!job.enabled) return 'disabled';
  if (!lastExec) return 'pending';
  if (lastExec.error || lastExec.status_code >= 400 || lastExec.status_code === 0) {
    return 'failure';
  }
  return 'success';
}

export async function GET(request: NextRequest) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const jobs = listJobs();
  const allStats = getAllJobStats();
  const allLastExecs = getAllLastExecutions();

  const enrichedJobs: Job[] = jobs.map((job) => {
    const stats = allStats.get(job.id) || { success: 0, failure: 0, total: 0 };
    const lastExec = allLastExecs.get(job.id);
    const lastStatus = computeLastStatus(job, lastExec);
    const nextRun = job.enabled ? getNextRun(job.expression, job.timezone) : '';

    return {
      ...job,
      next_run: nextRun,
      last_status: lastStatus,
      stats,
    };
  });

  return NextResponse.json(enrichedJobs);
}

export async function POST(request: NextRequest) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: JobFormData;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.name || !body.url || !body.expression) {
    return NextResponse.json(
      { error: 'name, url, and expression are required' },
      { status: 400 }
    );
  }

  const job = createJob(body);

  // Schedule if enabled
  if (job.enabled) {
    addJob({
      ...job,
      enabled: true,
    });
  }

  const enriched: Job = {
    ...job,
    next_run: job.enabled ? getNextRun(job.expression, job.timezone) : '',
    last_status: job.enabled ? 'pending' : 'disabled',
    stats: { success: 0, failure: 0, total: 0 },
  };

  return NextResponse.json(enriched, { status: 201 });
}
