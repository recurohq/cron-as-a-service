import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--text)] mb-1 block">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-md border ${error ? 'border-[var(--red)]' : 'border-[var(--border)]'} bg-[var(--bg)] text-[var(--text)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 placeholder:text-[var(--text-tertiary)] disabled:opacity-40 ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-[var(--red)] mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-[var(--text)] mb-1 block">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full rounded-md border ${error ? 'border-[var(--red)]' : 'border-[var(--border)]'} bg-[var(--bg)] text-[var(--text)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 placeholder:text-[var(--text-tertiary)] disabled:opacity-40 min-h-[80px] resize-y ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[var(--red)] mt-1">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-[var(--text)] mb-1 block">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-md border cursor-pointer ${error ? 'border-[var(--red)]' : 'border-[var(--border)]'} bg-[var(--bg)] text-[var(--text)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 disabled:opacity-40 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-[var(--red)] mt-1">{error}</p>}
    </div>
  );
}
