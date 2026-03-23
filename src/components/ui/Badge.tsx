import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]',
  success: 'bg-[var(--green-bg)] text-[var(--green)]',
  warning: 'bg-[var(--yellow-bg)] text-[var(--yellow)]',
  error: 'bg-[var(--red-bg)] text-[var(--red)]',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
