import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ensureInitialized } from '@/lib/init';
import { deleteBulkJobs } from '@/lib/db';
import { removeJob } from '@/lib/scheduler';

export async function DELETE(request: NextRequest) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { ids: string[] };
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

  // Remove from scheduler first
  for (const id of body.ids) {
    removeJob(id);
  }

  const deleted = deleteBulkJobs(body.ids);
  return NextResponse.json({ ok: true, deleted });
}
