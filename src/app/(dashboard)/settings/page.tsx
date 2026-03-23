'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { Settings } from '@/lib/types';

export default function SettingsPage() {
  const { settings, loading, error, refetch } = useSettings();
  const { addToast } = useToast();
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({ ...settings });
    }
  }, [settings]);

  const updateField = (key: keyof Settings, value: string) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setSaving(true);
    try {
      await api('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      addToast('Settings saved');
      refetch();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePurge = async () => {
    setPurging(true);
    try {
      await api('/api/settings/purge', { method: 'POST' });
      addToast('Execution history purged');
      setPurgeOpen(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Purge failed', 'error');
    } finally {
      setPurging(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // ignore
    }
    window.location.href = '/login';
  };

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[var(--red)]">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-[var(--text)] mb-6">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Notifications */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-[var(--text)]">Default notifications</h2>
          <Input
            label="Default notification email"
            value={form.default_notify_email}
            onChange={(e) => updateField('default_notify_email', e.target.value)}
            placeholder="alerts@example.com"
          />
          <Input
            label="Default notification URL"
            value={form.default_notify_url}
            onChange={(e) => updateField('default_notify_url', e.target.value)}
            placeholder="https://hooks.slack.com/..."
          />
        </div>

        {/* SMTP */}
        <div className="space-y-4 border-t border-[var(--border)] pt-4">
          <h2 className="text-sm font-medium text-[var(--text)]">SMTP configuration</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SMTP host"
              value={form.smtp_host}
              onChange={(e) => updateField('smtp_host', e.target.value)}
              placeholder="smtp.example.com"
            />
            <Input
              label="SMTP port"
              value={form.smtp_port}
              onChange={(e) => updateField('smtp_port', e.target.value)}
              placeholder="587"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SMTP user"
              value={form.smtp_user}
              onChange={(e) => updateField('smtp_user', e.target.value)}
              placeholder="user@example.com"
            />
            <Input
              label="SMTP password"
              type="password"
              value={form.smtp_pass}
              onChange={(e) => updateField('smtp_pass', e.target.value)}
              placeholder="********"
            />
          </div>
          <Input
            label="From address"
            value={form.smtp_from}
            onChange={(e) => updateField('smtp_from', e.target.value)}
            placeholder="cron@example.com"
          />
        </div>

        {/* Retention */}
        <div className="space-y-4 border-t border-[var(--border)] pt-4">
          <h2 className="text-sm font-medium text-[var(--text)]">Data retention</h2>
          <Input
            label="Retention days"
            type="number"
            value={form.retention_days}
            onChange={(e) => updateField('retention_days', e.target.value)}
            placeholder="30"
            min="1"
          />
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--border)] pt-4">
          <Button type="submit" loading={saving}>
            Save settings
          </Button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-10 border-t border-[var(--border)] pt-6 max-w-2xl">
        <h2 className="text-sm font-medium text-[var(--text)] mb-4">Danger zone</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text)]">Purge execution history</p>
              <p className="text-xs text-[var(--text-secondary)]">Delete all execution logs for all crons</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setPurgeOpen(true)}>
              Purge
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text)]">Log out</p>
              <p className="text-xs text-[var(--text-secondary)]">End your current session</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </div>

      {/* Purge confirmation modal */}
      <Modal open={purgeOpen} onClose={() => setPurgeOpen(false)} title="Purge execution history">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          This will permanently delete all execution history for all crons. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPurgeOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handlePurge} loading={purging}>
            Purge
          </Button>
        </div>
      </Modal>
    </div>
  );
}
