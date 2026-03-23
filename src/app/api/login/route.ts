import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/lib/init';
import { getHmacSecret, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  ensureInitialized();

  const expectedPassword = process.env.PASSWORD;
  if (!expectedPassword) {
    return NextResponse.json(
      { error: 'No PASSWORD environment variable configured' },
      { status: 500 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.password || body.password !== expectedPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const secret = getHmacSecret();
  const response = NextResponse.json({ ok: true });
  setSessionCookie(response, secret);
  return response;
}
