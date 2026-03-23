import { Badge } from '@/components/ui/Badge';
import type { JobStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: JobStatus | number;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (typeof status === 'number') {
    return <HttpStatusBadge code={status} className={className} />;
  }

  const config: Record<JobStatus, { variant: 'success' | 'error' | 'warning' | 'default'; label: string }> = {
    success: { variant: 'success', label: 'OK' },
    failure: { variant: 'error', label: 'Failed' },
    pending: { variant: 'warning', label: 'Pending' },
    disabled: { variant: 'default', label: 'Disabled' },
  };

  const { variant, label } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

function HttpStatusBadge({ code, className }: { code: number; className?: string }) {
  let variant: 'success' | 'warning' | 'error' | 'default';
  if (code === 0) {
    variant = 'error';
  } else if (code >= 200 && code < 300) {
    variant = 'success';
  } else if (code >= 400 && code < 500) {
    variant = 'warning';
  } else if (code >= 500) {
    variant = 'error';
  } else {
    variant = 'default';
  }

  return (
    <Badge variant={variant} className={className}>
      {code === 0 ? 'ERR' : code}
    </Badge>
  );
}
