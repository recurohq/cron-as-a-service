'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { CronBuilder } from '@/components/CronBuilder';
import { CronPreview } from '@/components/CronPreview';
import { KeyValueEditor } from '@/components/KeyValueEditor';
import { api } from '@/lib/api';
import type { Job, JobFormData, HttpMethod } from '@/lib/types';

const METHOD_OPTIONS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

const TIMEZONE_OPTIONS = (() => {
  const zones = Intl.supportedValuesOf('timeZone');
  return zones.map((tz) => ({ value: tz, label: tz }));
})();

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { addToast } = useToast();

  const [form, setForm] = useState<JobFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [jobName, setJobName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const job = await api<Job>(`/api/jobs/${id}`);
        setJobName(job.name);
        setForm({
          name: job.name,
          url: job.url,
          method: job.method,
          expression: job.expression,
          timezone: job.timezone,
          headers: job.headers || {},
          body: job.body || '',
          enabled: job.enabled,
          retries: job.retries,
          retry_interval: job.retry_interval,
          timeout: job.timeout,
          notify_url: job.notify_url || '',
          notify_email: job.notify_email || '',
        });
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to load job', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, addToast]);

  const updateField = <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    if (!form) return false;
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.url.trim()) errs.url = 'URL is required';
    if (!form.expression.trim()) errs.expression = 'Schedule is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || !validate()) return;

    setSaving(true);
    try {
      await api(`/api/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      addToast('Cron updated');
      router.push(`/jobs/${id}`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
          Crons
        </Link>
        <span className="text-sm text-[var(--text-tertiary)]">/</span>
        <Link href={`/jobs/${id}`} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
          {jobName}
        </Link>
        <span className="text-sm text-[var(--text-tertiary)]">/</span>
        <span className="text-sm text-[var(--text)]">Edit</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Basic info */}
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="My cron job"
            error={errors.name}
          />

          <div className="flex gap-3">
            <div className="w-28">
              <Select
                label="Method"
                value={form.method}
                onChange={(e) => updateField('method', e.target.value as HttpMethod)}
                options={METHOD_OPTIONS}
              />
            </div>
            <div className="flex-1">
              <Input
                label="URL"
                value={form.url}
                onChange={(e) => updateField('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
                error={errors.url}
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-[var(--text)] block">Schedule</label>
          <CronBuilder
            value={form.expression}
            onChange={(expr) => updateField('expression', expr)}
          />
          <CronPreview expression={form.expression} timezone={form.timezone} />
          {errors.expression && <p className="text-xs text-[var(--red)]">{errors.expression}</p>}
        </div>

        {/* Timezone */}
        <Select
          label="Timezone"
          value={form.timezone}
          onChange={(e) => updateField('timezone', e.target.value)}
          options={TIMEZONE_OPTIONS}
        />

        {/* Headers */}
        <KeyValueEditor
          label="Headers"
          value={form.headers}
          onChange={(headers) => updateField('headers', headers)}
          keyPlaceholder="Header name"
          valuePlaceholder="Header value"
        />

        {/* Body */}
        {form.method !== 'GET' && (
          <Textarea
            label="Request body"
            value={form.body}
            onChange={(e) => updateField('body', e.target.value)}
            placeholder='{"key": "value"}'
          />
        )}

        {/* Advanced */}
        <div className="border-t border-[var(--border)] pt-4 space-y-4">
          <h3 className="text-sm font-medium text-[var(--text)]">Advanced</h3>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Retries"
              type="number"
              value={form.retries.toString()}
              onChange={(e) => updateField('retries', parseInt(e.target.value) || 0)}
              min="0"
              max="10"
            />
            <Input
              label="Retry interval (s)"
              type="number"
              value={form.retry_interval.toString()}
              onChange={(e) => updateField('retry_interval', parseInt(e.target.value) || 60)}
              min="1"
            />
            <Input
              label="Timeout (s)"
              type="number"
              value={form.timeout.toString()}
              onChange={(e) => updateField('timeout', parseInt(e.target.value) || 30)}
              min="1"
              max="300"
            />
          </div>

          <Input
            label="Notification URL"
            value={form.notify_url}
            onChange={(e) => updateField('notify_url', e.target.value)}
            placeholder="https://hooks.slack.com/..."
          />

          <Input
            label="Notification email"
            value={form.notify_email}
            onChange={(e) => updateField('notify_email', e.target.value)}
            placeholder="alerts@example.com"
          />
        </div>

        {/* Enabled toggle */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
          <Toggle
            checked={form.enabled}
            onChange={(v) => updateField('enabled', v)}
            label="Enabled"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-[var(--border)] pt-4">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
          <Link href={`/jobs/${id}`}>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
