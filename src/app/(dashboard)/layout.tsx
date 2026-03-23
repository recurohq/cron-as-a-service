'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ToastProvider } from '@/components/ui/Toast';

const NAV_ITEMS = [
  { href: '/', label: 'Crons' },
  { href: '/settings', label: 'Settings' },
  { href: '/docs', label: 'Docs' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth', { credentials: 'same-origin' })
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/login';
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        setAuthChecked(true);
      });
  }, []);

  if (!authChecked) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname.startsWith('/jobs');
    }
    return pathname.startsWith(href);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-[var(--bg)]">
        {/* Top nav */}
        <header className="border-b border-[var(--border)] bg-[var(--bg)]">
          <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm font-semibold text-[var(--text)]">
                Cron by Recuro
              </Link>
              <nav className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-2.5 py-1 rounded-md text-sm transition-colors ${
                      isActive(item.href)
                        ? 'text-[var(--text)] bg-[var(--bg-subtle)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-4 text-center border-t border-[var(--border)]">
          <a
            href="https://recurohq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Cron by Recuro
          </a>
        </footer>
      </div>
    </ToastProvider>
  );
}
