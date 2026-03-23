const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export function parseCronExpression(expr: string): CronParts | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  return {
    minute: parts[0]!,
    hour: parts[1]!,
    dayOfMonth: parts[2]!,
    month: parts[3]!,
    dayOfWeek: parts[4]!,
  };
}

export function isValidCronExpression(expr: string): boolean {
  const parts = parseCronExpression(expr);
  if (!parts) return false;

  // Matches: *, */N, N, N-N, N/N, N-N/N, and comma-separated combos
  const fieldRegex = /^(\*|\d{1,2}(-\d{1,2})?)([/]\d{1,2})?(,(\*|\d{1,2}(-\d{1,2})?)([/]\d{1,2})?)*$/;

  return (
    fieldRegex.test(parts.minute) &&
    fieldRegex.test(parts.hour) &&
    fieldRegex.test(parts.dayOfMonth) &&
    fieldRegex.test(parts.month) &&
    fieldRegex.test(parts.dayOfWeek)
  );
}

export function describeCronExpression(expr: string): string {
  const parts = parseCronExpression(expr);
  if (!parts) return 'Invalid expression';

  const { minute, hour, dayOfMonth, month, dayOfWeek } = parts;

  // Every minute
  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every minute';
  }

  // Every N minutes
  if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const n = minute.slice(2);
    return `Every ${n} minute${n === '1' ? '' : 's'}`;
  }

  // Every N hours
  if (minute !== '*' && hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const n = hour.slice(2);
    return `Every ${n} hour${n === '1' ? '' : 's'} at minute ${minute}`;
  }

  // Specific time every day
  if (!minute.includes('*') && !minute.includes('/') && !hour.includes('*') && !hour.includes('/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Daily at ${formatTime(parseInt(hour), parseInt(minute))}`;
  }

  // Hourly at specific minute
  if (!minute.includes('*') && !minute.includes('/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Hourly at minute ${minute}`;
  }

  // Specific day of week
  if (!minute.includes('*') && !hour.includes('*') && dayOfMonth === '*' && month === '*' && dayOfWeek !== '*' && !dayOfWeek.includes('/')) {
    const days = dayOfWeek.split(',').map((d) => DAY_NAMES[parseInt(d)] ?? d).join(', ');
    return `${days} at ${formatTime(parseInt(hour), parseInt(minute))}`;
  }

  // Monthly on specific day
  if (!minute.includes('*') && !hour.includes('*') && dayOfMonth !== '*' && !dayOfMonth.includes('/') && month === '*' && dayOfWeek === '*') {
    return `Monthly on day ${dayOfMonth} at ${formatTime(parseInt(hour), parseInt(minute))}`;
  }

  // Specific month and day
  if (!minute.includes('*') && !hour.includes('*') && dayOfMonth !== '*' && month !== '*' && !month.includes('/') && dayOfWeek === '*') {
    const monthName = MONTH_NAMES[parseInt(month)] ?? month;
    return `${monthName} ${dayOfMonth} at ${formatTime(parseInt(hour), parseInt(minute))}`;
  }

  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

export function getNextExecutionTimes(expr: string, timezone: string, count: number = 5): Date[] {
  const parts = parseCronExpression(expr);
  if (!parts) return [];

  // Create formatter once, reused across all iterations
  let formatter: Intl.DateTimeFormat | null = null;
  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      hour: 'numeric',
      minute: 'numeric',
      day: 'numeric',
      month: 'numeric',
      weekday: 'short',
      hour12: false,
    });
  } catch {
    // Invalid timezone; matchesCron will fall back to UTC
  }

  const results: Date[] = [];
  const now = new Date();
  let current = new Date(now.getTime() + 60000);
  current.setSeconds(0, 0);

  const maxIterations = 525600; // ~1 year of minutes
  let iterations = 0;

  while (results.length < count && iterations < maxIterations) {
    iterations++;
    if (matchesCron(current, parts, formatter)) {
      results.push(new Date(current.getTime()));
    }
    current = new Date(current.getTime() + 60000);
  }

  return results;
}

function matchesCron(date: Date, parts: CronParts, formatter: Intl.DateTimeFormat | null): boolean {
  let d: { minute: number; hour: number; day: number; month: number; weekday: number };

  if (formatter) {
    try {
      const formatted = formatter.formatToParts(date);

      const get = (type: string): string =>
        formatted.find((p) => p.type === type)?.value ?? '0';

      const weekdayStr = get('weekday');
      const weekdayMap: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
      };

      d = {
        minute: parseInt(get('minute')),
        hour: parseInt(get('hour')),
        day: parseInt(get('day')),
        month: parseInt(get('month')),
        weekday: weekdayMap[weekdayStr] ?? 0,
      };
    } catch {
      const utc = date;
      d = {
        minute: utc.getUTCMinutes(),
        hour: utc.getUTCHours(),
        day: utc.getUTCDate(),
        month: utc.getUTCMonth() + 1,
        weekday: utc.getUTCDay(),
      };
    }
  } else {
    const utc = date;
    d = {
      minute: utc.getUTCMinutes(),
      hour: utc.getUTCHours(),
      day: utc.getUTCDate(),
      month: utc.getUTCMonth() + 1,
      weekday: utc.getUTCDay(),
    };
  }

  return (
    matchesField(d.minute, parts.minute, 0, 59) &&
    matchesField(d.hour, parts.hour, 0, 23) &&
    matchesField(d.day, parts.dayOfMonth, 1, 31) &&
    matchesField(d.month, parts.month, 1, 12) &&
    matchesField(d.weekday, parts.dayOfWeek, 0, 6)
  );
}

function matchesField(value: number, field: string, min: number, max: number): boolean {
  if (field === '*') return true;

  return field.split(',').some((part) => {
    if (part.includes('/')) {
      const [rangeStr, stepStr] = part.split('/');
      const step = parseInt(stepStr ?? '1');
      const start = rangeStr === '*' ? min : parseInt(rangeStr ?? '0');
      for (let i = start; i <= max; i += step) {
        if (i === value) return true;
      }
      return false;
    }

    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr ?? '0');
      const end = parseInt(endStr ?? '0');
      return value >= start && value <= end;
    }

    return parseInt(part) === value;
  });
}

export type CronBuilderTab = 'minutes' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

export function detectCronTab(expr: string): CronBuilderTab {
  const parts = parseCronExpression(expr);
  if (!parts) return 'custom';

  const { minute, hour, dayOfMonth, month, dayOfWeek } = parts;

  if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'minutes';
  }

  if (!minute.includes('*') && !minute.includes('/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'hourly';
  }

  if (!minute.includes('*') && !hour.includes('*') && !hour.includes('/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'daily';
  }

  if (!minute.includes('*') && !hour.includes('*') && dayOfMonth === '*' && month === '*' && dayOfWeek !== '*' && !dayOfWeek.includes('/')) {
    return 'weekly';
  }

  if (!minute.includes('*') && !hour.includes('*') && dayOfMonth !== '*' && !dayOfMonth.includes('/') && month === '*' && dayOfWeek === '*') {
    return 'monthly';
  }

  return 'custom';
}

export function buildCronExpression(tab: CronBuilderTab, config: {
  everyMinutes?: number;
  atMinute?: number;
  atHour?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  customExpr?: string;
}): string {
  const min = config.atMinute ?? 0;
  const hr = config.atHour ?? 0;

  switch (tab) {
    case 'minutes':
      return `*/${config.everyMinutes ?? 5} * * * *`;
    case 'hourly':
      return `${min} * * * *`;
    case 'daily':
      return `${min} ${hr} * * *`;
    case 'weekly': {
      const days = config.daysOfWeek?.length ? config.daysOfWeek.join(',') : '1';
      return `${min} ${hr} * * ${days}`;
    }
    case 'monthly':
      return `${min} ${hr} ${config.dayOfMonth ?? 1} * *`;
    case 'custom':
      return config.customExpr ?? '* * * * *';
  }
}
