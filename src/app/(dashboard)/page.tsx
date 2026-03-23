'use client';

import { useState, useMemo, useCallback, useRef, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useJobs } from '@/hooks/useJobs';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { StatusBadge } from '@/components/StatusBadge';
import { JobStatsBar } from '@/components/JobStatsBar';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import { describeCronExpression } from '@/lib/cron';
import type { Job, SortField, SortDirection } from '@/lib/types';

export default function JobsListPage() {
  const router = useRouter();
  const { jobs, loading, error, refetch } = useJobs();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    let result = jobs;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.name.toLowerCase().includes(q) ||
          j.url.toLowerCase().includes(q) ||
          j.expression.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'next_run':
          cmp = new Date(a.next_run || 0).getTime() - new Date(b.next_run || 0).getTime();
          break;
        case 'success_rate': {
          const rateA = a.stats.total > 0 ? a.stats.success / a.stats.total : 0;
          const rateB = b.stats.total > 0 ? b.stats.success / b.stats.total : 0;
          cmp = rateA - rateB;
          break;
        }
        case 'last_status': {
          const order: Record<string, number> = { success: 0, failure: 1, pending: 2, disabled: 3 };
          cmp = (order[a.last_status] ?? 9) - (order[b.last_status] ?? 9);
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [jobs, search, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((j) => j.id)));
    }
  };

  const handleToggle = async (job: Job) => {
    try {
      await api(`/api/jobs/${job.id}/toggle`, { method: 'POST', body: JSON.stringify({ enabled: !job.enabled }) });
      refetch();
      addToast(`${job.name} ${job.enabled ? 'disabled' : 'enabled'}`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to toggle', 'error');
    }
  };

  const handleBulkToggle = async (enabled: boolean) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await api('/api/jobs/bulk/toggle', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selected), enabled }),
      });
      refetch();
      setSelected(new Set());
      addToast(`${selected.size} job(s) ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Bulk action failed', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await api('/api/jobs/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      refetch();
      setSelected(new Set());
      addToast(`${selected.size} job(s) deleted`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Bulk delete failed', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api(`/api/jobs/${deleteConfirm.id}`, { method: 'DELETE' });
      refetch();
      addToast(`${deleteConfirm.name} deleted`);
      setDeleteConfirm(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cron-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Jobs exported');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Export failed', 'error');
    }
  };

  const handleImport = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await api('/api/import', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        refetch();
        addToast('Jobs imported');
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Import failed', 'error');
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [refetch, addToast]
  );

  if (loading) {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[var(--text)]">Crons</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExport}>
            Export
          </Button>
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Link href="/jobs/new">
            <Button size="sm">New cron</Button>
          </Link>
        </div>
      </div>

      {/* Search + bulk actions */}
      <div className="flex items-center gap-3 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search crons..."
          className="flex-1 max-w-xs rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder:text-[var(--text-tertiary)]"
        />
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">{selected.size} selected</span>
            <Button variant="ghost" size="sm" onClick={() => handleBulkToggle(true)} loading={bulkLoading}>
              Enable
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleBulkToggle(false)} loading={bulkLoading}>
              Disable
            </Button>
            <Button variant="danger" size="sm" onClick={handleBulkDelete} loading={bulkLoading}>
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--text-tertiary)]">
            {jobs.length === 0 ? 'No crons yet' : 'No crons match your search'}
          </p>
          {jobs.length === 0 && (
            <Link href="/jobs/new" className="text-sm text-[var(--accent)] hover:underline mt-2 inline-block">
              Create your first cron
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                  />
                </th>
                <th
                  className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                  onClick={() => handleSort('name')}
                >
                  Name{sortIcon('name')}
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">
                  Schedule
                </th>
                <th
                  className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                  onClick={() => handleSort('last_status')}
                >
                  Status{sortIcon('last_status')}
                </th>
                <th
                  className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                  onClick={() => handleSort('success_rate')}
                >
                  Success{sortIcon('success_rate')}
                </th>
                <th
                  className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                  onClick={() => handleSort('next_run')}
                >
                  Next run{sortIcon('next_run')}
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)] w-16">
                  Enabled
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-[var(--text-secondary)] w-10">
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(job.id)}
                      onChange={() => toggleSelect(job.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="text-sm font-medium text-[var(--text)]">{job.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)] truncate max-w-[200px]">{job.url}</div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="text-sm text-[var(--text)]">{describeCronExpression(job.expression)}</div>
                    <div className="text-xs text-[var(--text-tertiary)] font-mono">{job.expression}</div>
                  </td>
                  <td className="py-2 px-3">
                    <StatusBadge status={job.last_status} />
                  </td>
                  <td className="py-2 px-3">
                    <JobStatsBar
                      success={job.stats.success}
                      failure={job.stats.failure}
                      total={job.stats.total}
                    />
                  </td>
                  <td className="py-2 px-3 text-sm text-[var(--text-secondary)]">
                    {relativeTime(job.next_run)}
                  </td>
                  <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                    <Toggle
                      checked={job.enabled}
                      onChange={() => handleToggle(job)}
                      size="sm"
                    />
                  </td>
                  <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setDeleteConfirm(job)}
                      className="text-[var(--text-tertiary)] hover:text-[var(--red)] text-sm cursor-pointer"
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete cron">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Are you sure you want to delete <strong className="text-[var(--text)]">{deleteConfirm?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
