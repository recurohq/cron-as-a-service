export function relativeTime(dateStr: string): string {
  if (!dateStr) return 'Never';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isFuture = diffMs > 0;

  if (absDiffMs < 60_000) {
    return isFuture ? 'in a few seconds' : 'just now';
  }

  const minutes = Math.floor(absDiffMs / 60_000);
  if (minutes < 60) {
    const label = minutes === 1 ? 'minute' : 'minutes';
    return isFuture ? `in ${minutes} ${label}` : `${minutes} ${label} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const label = hours === 1 ? 'hour' : 'hours';
    return isFuture ? `in ${hours} ${label}` : `${hours} ${label} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    const label = days === 1 ? 'day' : 'days';
    return isFuture ? `in ${days} ${label}` : `${days} ${label} ago`;
  }

  const months = Math.floor(days / 30);
  const label = months === 1 ? 'month' : 'months';
  return isFuture ? `in ${months} ${label}` : `${months} ${label} ago`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

export function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}
