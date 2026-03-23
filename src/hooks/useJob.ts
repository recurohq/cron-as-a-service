import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { usePolling } from './usePolling';
import type { Job, Execution } from '@/lib/types';

interface UseJobResult {
  job: Job | null;
  executions: Execution[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  loadMoreExecutions: () => Promise<void>;
  hasMoreExecutions: boolean;
}

export function useJob(id: string): UseJobResult {
  const [job, setJob] = useState<Job | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Poll only job metadata (no executions reset)
  const fetchJob = useCallback(async () => {
    try {
      const jobData = await api<Job>(`/api/jobs/${id}`);
      setJob(jobData);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.message !== 'Unauthorized') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Full fetch: job + executions (initial load + explicit refetch)
  const fetchAll = useCallback(async () => {
    try {
      const [jobData, execData] = await Promise.all([
        api<Job>(`/api/jobs/${id}`),
        api<{ executions: Execution[]; total: number }>(`/api/jobs/${id}/executions?page=1&limit=25`),
      ]);
      setJob(jobData);
      setExecutions(execData?.executions ?? []);
      setHasMore((execData?.executions ?? []).length >= 25);
      setPage(1);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.message !== 'Unauthorized') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load fetches everything
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Poll only job metadata
  usePolling(fetchJob, 30_000, true);

  const loadMoreExecutions = useCallback(async () => {
    const nextPage = page + 1;
    try {
      const moreExec = await api<{ executions: Execution[]; total: number }>(
        `/api/jobs/${id}/executions?page=${nextPage}&limit=25`
      );
      const newExecs = moreExec?.executions ?? [];
      setExecutions((prev) => [...prev, ...newExecs]);
      setHasMore(newExecs.length >= 25);
      setPage(nextPage);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }, [id, page]);

  return {
    job,
    executions,
    loading,
    error,
    refetch: fetchAll,
    loadMoreExecutions,
    hasMoreExecutions: hasMore,
  };
}
