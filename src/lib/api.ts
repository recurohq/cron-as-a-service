const BASE = '';

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (res.status === 401) { window.location.href = '/login'; throw new Error('Unauthorized'); }
  if (!res.ok) { const body = await res.text(); throw new Error(body || `HTTP ${res.status}`); }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
