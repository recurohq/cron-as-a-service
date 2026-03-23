import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ensureInitialized } from '@/lib/init';
import { toggleJob, getJob } from '@/lib/db';
import { addJob, removeJob } from '@/lib/scheduler';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { enabled: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json(
      { error: 'enabled must be a boolean' },
      { status: 400 }
    );
  }

  const success = toggleJob(id, body.enabled);
  if (!success) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Update scheduler
  const job = getJob(id);
  if (job) {
    if (body.enabled) {
      addJob({ ...job, enabled: true });
    } else {
      removeJob(id);
    }
  }

  return NextResponse.json({ ok: true, enabled: body.enabled });
}
