"use client";

import { useState } from 'react';
import type { Execution } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { formatDateShort, formatLatency, truncate } from '@/lib/format';

interface ExecutionTableProps {
  executions: Execution[];
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
}

export function ExecutionTable({ executions, onLoadMore, hasMore }: ExecutionTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    if (!onLoadMore) return;
    setLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setLoadingMore(false);
    }
  };

  if (executions.length === 0) {
    return <p className="text-sm text-[var(--text-tertiary)] py-8 text-center">No executions yet</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Time</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Status</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Latency</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Attempt</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Error</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((exec) => (
              <ExecutionRow
                key={exec.id}
                execution={exec}
                expanded={expandedId === exec.id}
                onToggle={() => setExpandedId(expandedId === exec.id ? null : exec.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && onLoadMore && (
        <div className="py-3 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer disabled:opacity-40"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

function ExecutionRow({
  execution,
  expanded,
  onToggle,
}: {
  execution: Execution;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] cursor-pointer"
      >
        <td className="py-2 px-3 text-sm text-[var(--text)]">
          {formatDateShort(execution.started_at)}
        </td>
        <td className="py-2 px-3">
          <StatusBadge status={execution.status_code} />
        </td>
        <td className="py-2 px-3 text-sm text-[var(--text-secondary)]">
          {formatLatency(execution.latency_ms)}
        </td>
        <td className="py-2 px-3 text-sm text-[var(--text-secondary)]">
          {execution.attempt}
        </td>
        <td className="py-2 px-3 text-sm text-[var(--text-secondary)]">
          {execution.error ? truncate(execution.error, 60) : '-'}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[var(--bg-subtle)]">
          <td colSpan={5} className="px-3 py-3">
            {execution.error && (
              <div className="mb-2">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Error</p>
                <pre className="text-sm text-[var(--red)] bg-[var(--bg)] rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-words border border-[var(--border)]">
                  {execution.error}
                </pre>
              </div>
            )}
            {execution.response_body && (
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">Response</p>
                <pre className="text-sm text-[var(--text)] bg-[var(--bg)] rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-words max-h-64 overflow-y-auto border border-[var(--border)]">
                  {formatResponseBody(execution.response_body)}
                </pre>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function formatResponseBody(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}
