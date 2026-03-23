interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, disabled = false, label, size = 'md' }: ToggleProps) {
  const dims = size === 'sm'
    ? { track: 'w-8 h-[18px]', thumb: 'h-3.5 w-3.5', translate: 'translate-x-3.5' }
    : { track: 'w-11 h-6', thumb: 'h-5 w-5', translate: 'translate-x-5' };

  return (
    <label className={`inline-flex items-center gap-2 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex flex-shrink-0 cursor-pointer ${dims.track} rounded-full border-2 border-transparent transition-colors ${checked ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
      >
        <span
          className={`pointer-events-none inline-block ${dims.thumb} rounded-full bg-white transition-transform ${checked ? dims.translate : 'translate-x-0'}`}
        />
      </button>
      {label && <span className="text-sm text-[var(--text)]">{label}</span>}
    </label>
  );
}
