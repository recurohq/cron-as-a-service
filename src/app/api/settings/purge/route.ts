import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ensureInitialized } from '@/lib/init';
import { cleanupExecutions, getSetting } from '@/lib/db';

export async function POST(request: NextRequest) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const retentionStr = getSetting('retention_days');
  const retentionDays = retentionStr ? parseInt(retentionStr, 10) : 30;

  if (retentionDays <= 0) {
    return NextResponse.json(
      { error: 'retention_days must be a positive number' },
      { status: 400 }
    );
  }

  const deleted = cleanupExecutions(retentionDays);

  return NextResponse.json({
    ok: true,
    deleted,
    retention_days: retentionDays,
  });
}
