"use client";

import { useMemo, useState, useEffect } from 'react';
import { describeCronExpression, getNextExecutionTimes, isValidCronExpression } from '@/lib/cron';
import { formatDateShort } from '@/lib/format';

interface CronPreviewProps {
  expression: string;
  timezone: string;
}

export function CronPreview({ expression, timezone }: CronPreviewProps) {
  const [debouncedExpr, setDebouncedExpr] = useState(expression);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedExpr(expression), 300);
    return () => clearTimeout(t);
  }, [expression]);

  const isValid = useMemo(() => isValidCronExpression(debouncedExpr), [debouncedExpr]);
  const description = useMemo(() => describeCronExpression(debouncedExpr), [debouncedExpr]);
  const nextRuns = useMemo(
    () => (isValid ? getNextExecutionTimes(debouncedExpr, timezone || 'UTC', 3) : []),
    [debouncedExpr, timezone, isValid]
  );

  if (!debouncedExpr.trim()) return null;

  if (!isValid) {
    return <p className="text-sm text-[var(--red)]">Invalid cron expression</p>;
  }

  return (
    <div className="text-sm text-[var(--text-secondary)]">
      <p>{description}</p>
      {nextRuns.length > 0 && (
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          Next: {nextRuns.map((d) => formatDateShort(d.toISOString())).join(' · ')}
        </p>
      )}
    </div>
  );
}
