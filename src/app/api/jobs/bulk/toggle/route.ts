import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ensureInitialized } from '@/lib/init';
import { toggleBulkJobs, getJob } from '@/lib/db';
import { addJob, removeJob } from '@/lib/scheduler';

export async function POST(request: NextRequest) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { ids: string[]; enabled: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json(
      { error: 'ids must be a non-empty array' },
      { status: 400 }
    );
  }

  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json(
      { error: 'enabled must be a boolean' },
      { status: 400 }
    );
  }

  const updated = toggleBulkJobs(body.ids, body.enabled);

  // Update scheduler for each job
  for (const id of body.ids) {
    if (body.enabled) {
      const job = getJob(id);
      if (job) {
        addJob({ ...job, enabled: true });
      }
    } else {
      removeJob(id);
    }
  }

  return NextResponse.json({ ok: true, updated, enabled: body.enabled });
}
