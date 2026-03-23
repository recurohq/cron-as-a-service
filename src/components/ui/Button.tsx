import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  children: ReactNode;
}

const variants = {
  primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
  secondary: 'bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg-subtle)]',
  danger: 'bg-[var(--red)] text-white hover:opacity-90',
  ghost: 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-subtle)]',
};

const sizes = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-3 py-1.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {children}{loading ? '...' : ''}
    </button>
  );
}
