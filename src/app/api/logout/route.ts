import { NextResponse } from 'next/server';
import { ensureInitialized } from '@/lib/init';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  ensureInitialized();

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
