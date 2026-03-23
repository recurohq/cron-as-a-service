'use client';

import { useState, type FormEvent } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const body = await res.text();
        setError(body || 'Invalid password');
        return;
      }

      window.location.href = '/';
    } catch {
      setError('Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* Theme toggle top-right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-xs">
          <h1 className="text-lg font-semibold text-[var(--text)] mb-6 text-center">
            Cron by Recuro
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 placeholder:text-[var(--text-tertiary)]"
              />
              {error && <p className="text-xs text-[var(--red)] mt-1.5">{error}</p>}
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Log in
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <span className="text-xs text-[var(--text-tertiary)]">
          Made by{' '}
          <a
            href="https://recurohq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            Recuro
          </a>
        </span>
      </footer>
    </div>
  );
}
