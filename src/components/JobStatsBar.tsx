interface JobStatsBarProps {
  success: number;
  failure: number;
  total: number;
  className?: string;
}

export function JobStatsBar({ success, failure, total, className = '' }: JobStatsBarProps) {
  if (total === 0) {
    return <span className={`text-xs text-[var(--text-tertiary)] ${className}`}>&mdash;</span>;
  }

  const successPct = (success / total) * 100;
  const failurePct = (failure / total) * 100;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-0.5 bg-[var(--border)] overflow-hidden min-w-[48px] flex rounded">
        {successPct > 0 && (
          <div className="h-full bg-[var(--green)]" style={{ width: `${successPct}%` }} />
        )}
        {failurePct > 0 && (
          <div className="h-full bg-[var(--red)]" style={{ width: `${failurePct}%` }} />
        )}
      </div>
      <span className="text-xs text-[var(--text-secondary)]">{success}/{total}</span>
    </div>
  );
}
