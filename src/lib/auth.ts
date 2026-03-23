import { createHmac, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting } from './db';

const COOKIE_NAME = 'cron_session';
const SESSION_DAYS = parseInt(process.env.SESSION_DAYS || '7', 10);

function generateHmacSecret(): string {
  const existing = getSetting('hmac_secret');
  if (existing) return existing;
  const secret = randomBytes(32).toString('hex');
  setSetting('hmac_secret', secret);
  return secret;
}

let cachedHmacSecret: string | null = null;

function getHmacSecret(): string {
  if (cachedHmacSecret) return cachedHmacSecret;
  const secret = getSetting('hmac_secret');
  if (!secret) {
    cachedHmacSecret = generateHmacSecret();
    return cachedHmacSecret;
  }
  cachedHmacSecret = secret;
  return cachedHmacSecret;
}

function signCookie(value: string, secret: string): string {
  const signature = createHmac('sha256', secret).update(value).digest('hex');
  return `${value}.${signature}`;
}

function validateCookie(cookieValue: string, secret: string): boolean {
  const lastDot = cookieValue.lastIndexOf('.');
  if (lastDot === -1) return false;

  const value = cookieValue.slice(0, lastDot);
  const signature = cookieValue.slice(lastDot + 1);

  const expectedSignature = createHmac('sha256', secret)
    .update(value)
    .digest('hex');

  // Constant-time comparison
  if (signature.length !== expectedSignature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return mismatch === 0;
}

function setSessionCookie(
  response: NextResponse,
  secret: string,
  sessionDays: number = SESSION_DAYS
): void {
  const cookieValue = signCookie('authenticated', secret);
  response.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionDays * 24 * 60 * 60,
  });
}

function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

function isAuthenticated(request: NextRequest): boolean {
  // If no PASSWORD env var is set, skip auth
  if (!process.env.PASSWORD) return true;

  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return false;

  const secret = getHmacSecret();
  return validateCookie(cookie.value, secret);
}

export {
  generateHmacSecret,
  getHmacSecret,
  signCookie,
  validateCookie,
  setSessionCookie,
  clearSessionCookie,
  isAuthenticated,
  COOKIE_NAME,
  SESSION_DAYS,
};
