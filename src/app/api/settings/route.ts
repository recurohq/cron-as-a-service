import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ensureInitialized } from '@/lib/init';
import { getAllSettings, setMultipleSettings } from '@/lib/db';

const HIDDEN_KEYS = new Set(['hmac_secret']);

function filterSettings(settings: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (!HIDDEN_KEYS.has(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

export async function GET(request: NextRequest) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const settings = getAllSettings();
  return NextResponse.json(filterSettings(settings as Record<string, unknown>));
}

export async function PUT(request: NextRequest) {
  ensureInitialized();
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Body must be a key-value object' },
      { status: 400 }
    );
  }

  // Convert all values to strings, skip protected keys
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!HIDDEN_KEYS.has(key)) {
      sanitized[key] = String(value);
    }
  }

  setMultipleSettings(sanitized);
  const settings = getAllSettings();
  return NextResponse.json(filterSettings(settings as Record<string, unknown>));
}
