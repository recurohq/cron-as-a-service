import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ensureInitialized } from '@/lib/init';
import {
  getJob,
  updateJob,
  deleteJob,
  getJobStats,
  getLastExecution,
} from '@/lib/db';
import { addJob, removeJob, getNextRun } from '@/lib/scheduler';
import type { Job, JobFormData, JobStatus } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

function computeLastStatus(
  job: { enabled: boolean },
  lastExec: { status_code: number; error: string } | null
): JobStatus {
  if (!job.enabled) return 'disabled';
  if (!lastExec) return 'pending';
  if (lastExec.error || lastExec.status_code >= 400 || lastExec.status_code === 0) {
    return 'failure';
  }
  return 'success';
}

export async function GET(request: NextRequest, context: RouteContext) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const stats = getJobStats(id);
  const lastExec = getLastExecution(id);
  const lastStatus = computeLastStatus(job, lastExec);
  const nextRun = job.enabled ? getNextRun(job.expression, job.timezone) : '';

  const enriched: Job = {
    ...job,
    next_run: nextRun,
    last_status: lastStatus,
    stats,
  };

  return NextResponse.json(enriched);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  let body: Partial<JobFormData>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updated = updateJob(id, body);
  if (!updated) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Reschedule: remove old, add new if enabled
  removeJob(id);
  if (updated.enabled) {
    addJob({
      ...updated,
      enabled: true,
    });
  }

  const stats = getJobStats(id);
  const lastExec = getLastExecution(id);
  const lastStatus = computeLastStatus(updated, lastExec);
  const nextRun = updated.enabled
    ? getNextRun(updated.expression, updated.timezone)
    : '';

  const enriched: Job = {
    ...updated,
    next_run: nextRun,
    last_status: lastStatus,
    stats,
  };

  return NextResponse.json(enriched);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  removeJob(id);
  const deleted = deleteJob(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
