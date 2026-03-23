"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  type CronBuilderTab,
  detectCronTab,
  buildCronExpression,
  parseCronExpression,
} from '@/lib/cron';

interface CronBuilderProps {
  value: string;
  onChange: (expr: string) => void;
}

const TABS: { id: CronBuilderTab; label: string }[] = [
  { id: 'minutes', label: 'Every N min' },
  { id: 'hourly', label: 'Hourly' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'custom', label: 'Custom' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MINUTE_OPTIONS = [1, 2, 3, 4, 5, 10, 15, 20, 30, 45];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OF_HOUR = Array.from({ length: 60 }, (_, i) => i);
const DAY_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

const selectClass = 'rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] px-2 py-1 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]';

export function CronBuilder({ value, onChange }: CronBuilderProps) {
  const [activeTab, setActiveTab] = useState<CronBuilderTab>(() => detectCronTab(value));
  const [everyMinutes, setEveryMinutes] = useState(5);
  const [atMinute, setAtMinute] = useState(0);
  const [atHour, setAtHour] = useState(9);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [customExpr, setCustomExpr] = useState(value);

  useEffect(() => {
    const parts = parseCronExpression(value);
    if (!parts) return;

    const tab = detectCronTab(value);
    setActiveTab(tab);

    const minVal = parseInt(parts.minute) || 0;
    const hrVal = parseInt(parts.hour) || 0;

    switch (tab) {
      case 'minutes': {
        const n = parts.minute.startsWith('*/') ? parseInt(parts.minute.slice(2)) : 5;
        setEveryMinutes(n);
        break;
      }
      case 'hourly':
        setAtMinute(minVal);
        break;
      case 'daily':
        setAtMinute(minVal);
        setAtHour(hrVal);
        break;
      case 'weekly':
        setAtMinute(minVal);
        setAtHour(hrVal);
        setDaysOfWeek(parts.dayOfWeek.split(',').map(Number));
        break;
      case 'monthly':
        setAtMinute(minVal);
        setAtHour(hrVal);
        setDayOfMonth(parseInt(parts.dayOfMonth) || 1);
        break;
      case 'custom':
        setCustomExpr(value);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emitChange = useCallback(
    (tab: CronBuilderTab, config: Parameters<typeof buildCronExpression>[1]) => {
      onChange(buildCronExpression(tab, config));
    },
    [onChange]
  );

  const handleTabChange = (tab: CronBuilderTab) => {
    setActiveTab(tab);
    if (tab === 'custom') {
      setCustomExpr(value);
    } else {
      emitChange(tab, { everyMinutes, atMinute, atHour, daysOfWeek, dayOfMonth });
    }
  };

  const handleEveryMinutes = (n: number) => {
    setEveryMinutes(n);
    emitChange('minutes', { everyMinutes: n });
  };

  const handleAtMinute = (m: number) => {
    setAtMinute(m);
    emitChange(activeTab, { everyMinutes, atMinute: m, atHour, daysOfWeek, dayOfMonth });
  };

  const handleAtHour = (h: number) => {
    setAtHour(h);
    emitChange(activeTab, { everyMinutes, atMinute, atHour: h, daysOfWeek, dayOfMonth });
  };

  const handleDayOfWeek = (day: number) => {
    const newDays = daysOfWeek.includes(day)
      ? daysOfWeek.filter((d) => d !== day)
      : [...daysOfWeek, day].sort();
    if (newDays.length === 0) return;
    setDaysOfWeek(newDays);
    emitChange('weekly', { atMinute, atHour, daysOfWeek: newDays });
  };

  const handleDayOfMonth = (d: number) => {
    setDayOfMonth(d);
    emitChange('monthly', { atMinute, atHour, dayOfMonth: d });
  };

  const handleCustomExpr = (expr: string) => {
    setCustomExpr(expr);
    onChange(expr);
  };

  const formatHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  };

  return (
    <div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`px-2 py-1 text-sm transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'text-[var(--text)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'minutes' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text)]">Every</span>
            <select value={everyMinutes} onChange={(e) => handleEveryMinutes(parseInt(e.target.value))} className={selectClass}>
              {MINUTE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-sm text-[var(--text)]">minutes</span>
          </div>
        )}

        {activeTab === 'hourly' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text)]">At minute</span>
            <select value={atMinute} onChange={(e) => handleAtMinute(parseInt(e.target.value))} className={selectClass}>
              {MINUTE_OF_HOUR.map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text)]">At</span>
            <select value={atHour} onChange={(e) => handleAtHour(parseInt(e.target.value))} className={selectClass}>
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
            <span className="text-sm text-[var(--text-secondary)]">:</span>
            <select value={atMinute} onChange={(e) => handleAtMinute(parseInt(e.target.value))} className={selectClass}>
              {MINUTE_OF_HOUR.map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="space-y-3">
            <div className="flex gap-1 flex-wrap">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleDayOfWeek(i)}
                  className={`px-2.5 py-1 rounded-md text-sm transition-colors cursor-pointer ${
                    daysOfWeek.includes(i)
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text)]">at</span>
              <select value={atHour} onChange={(e) => handleAtHour(parseInt(e.target.value))} className={selectClass}>
                {HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
              <span className="text-sm text-[var(--text-secondary)]">:</span>
              <select value={atMinute} onChange={(e) => handleAtMinute(parseInt(e.target.value))} className={selectClass}>
                {MINUTE_OF_HOUR.map((m) => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-[var(--text)]">Day</span>
            <select value={dayOfMonth} onChange={(e) => handleDayOfMonth(parseInt(e.target.value))} className={selectClass}>
              {DAY_OF_MONTH.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <span className="text-sm text-[var(--text)]">at</span>
            <select value={atHour} onChange={(e) => handleAtHour(parseInt(e.target.value))} className={selectClass}>
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
            <span className="text-sm text-[var(--text-secondary)]">:</span>
            <select value={atMinute} onChange={(e) => handleAtMinute(parseInt(e.target.value))} className={selectClass}>
              {MINUTE_OF_HOUR.map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'custom' && (
          <div>
            <input
              type="text"
              value={customExpr}
              onChange={(e) => handleCustomExpr(e.target.value)}
              placeholder="* * * * *"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder:text-[var(--text-tertiary)]"
            />
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              minute hour day-of-month month day-of-week
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
