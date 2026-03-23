'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useJob } from '@/hooks/useJob';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { JobStatsBar } from '@/components/JobStatsBar';
import { ExecutionTable } from '@/components/ExecutionTable';
import { Toggle } from '@/components/ui/Toggle';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { formatDate, relativeTime } from '@/lib/format';
import { describeCronExpression } from '@/lib/cron';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { job, executions, loading, error, refetch, loadMoreExecutions, hasMoreExecutions } = useJob(id);
  const { addToast } = useToast();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [running, setRunning] = useState(false);

  const handleToggle = async () => {
    if (!job) return;
    try {
      await api(`/api/jobs/${job.id}/toggle`, { method: 'POST', body: JSON.stringify({ enabled: !job.enabled }) });
      refetch();
      addToast(`${job.name} ${job.enabled ? 'disabled' : 'enabled'}`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Toggle failed', 'error');
    }
  };

  const handleRun = async () => {
    if (!job) return;
    setRunning(true);
    try {
      await api(`/api/jobs/${job.id}/run`, { method: 'POST' });
      addToast('Cron triggered');
      setTimeout(() => refetch(), 2000);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Run failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    setDeleting(true);
    try {
      await api(`/api/jobs/${job.id}`, { method: 'DELETE' });
      addToast(`${job.name} deleted`);
      router.push('/');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[var(--red)]">{error || 'Job not found'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
          Crons
        </Link>
        <span className="text-sm text-[var(--text-tertiary)]">/</span>
        <span className="text-sm text-[var(--text)]">{job.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-lg font-semibold text-[var(--text)]">{job.name}</h1>
            <StatusBadge status={job.last_status} />
          </div>
          <p className="text-sm text-[var(--text-secondary)] break-all">{job.url}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Toggle checked={job.enabled} onChange={handleToggle} size="sm" />
          <Button variant="secondary" size="sm" onClick={handleRun} loading={running}>
            Run now
          </Button>
          <Link href={`/jobs/${job.id}/edit`}>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </Link>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 border border-[var(--border)] rounded-md p-4">
        <InfoItem label="Method" value={job.method} />
        <InfoItem label="Schedule" value={describeCronExpression(job.expression)}>
          <span className="text-xs text-[var(--text-tertiary)] font-mono">{job.expression}</span>
        </InfoItem>
        <InfoItem label="Timezone" value={job.timezone} />
        <InfoItem label="Next run" value={relativeTime(job.next_run)}>
          <span className="text-xs text-[var(--text-tertiary)]">{formatDate(job.next_run)}</span>
        </InfoItem>
        <InfoItem label="Timeout" value={`${job.timeout}s`} />
        <InfoItem label="Retries" value={`${job.retries} (every ${job.retry_interval}s)`} />
        <div className="col-span-2">
          <InfoItem label="Success rate">
            <JobStatsBar success={job.stats.success} failure={job.stats.failure} total={job.stats.total} />
          </InfoItem>
        </div>
        {Object.keys(job.headers).length > 0 && (
          <div className="col-span-2 md:col-span-4">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Headers</p>
            <div className="text-sm text-[var(--text)] font-mono bg-[var(--bg-subtle)] rounded-md p-2 text-xs overflow-x-auto">
              {Object.entries(job.headers).map(([k, v]) => (
                <div key={k}>{k}: {v}</div>
              ))}
            </div>
          </div>
        )}
        {job.body && (
          <div className="col-span-2 md:col-span-4">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Body</p>
            <pre className="text-sm text-[var(--text)] font-mono bg-[var(--bg-subtle)] rounded-md p-2 text-xs overflow-x-auto whitespace-pre-wrap break-words">
              {formatBody(job.body)}
            </pre>
          </div>
        )}
        {(job.notify_url || job.notify_email) && (
          <div className="col-span-2 md:col-span-4">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Notifications</p>
            <div className="text-sm text-[var(--text)]">
              {job.notify_url && <p className="text-xs">URL: {job.notify_url}</p>}
              {job.notify_email && <p className="text-xs">Email: {job.notify_email}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Executions */}
      <div>
        <h2 className="text-sm font-medium text-[var(--text)] mb-3">Execution history</h2>
        <ExecutionTable
          executions={executions}
          onLoadMore={loadMoreExecutions}
          hasMore={hasMoreExecutions}
        />
      </div>

      {/* Delete modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete cron">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Are you sure you want to delete <strong className="text-[var(--text)]">{job.name}</strong>? This will also remove all execution history.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteOpen(false)}>
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

function InfoItem({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-[var(--text-secondary)] mb-0.5">{label}</p>
      {value && <p className="text-sm text-[var(--text)]">{value}</p>}
      {children}
    </div>
  );
}

function formatBody(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}
