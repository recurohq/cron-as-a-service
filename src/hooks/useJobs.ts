import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { usePolling } from './usePolling';
import type { Job } from '@/lib/types';

interface UseJobsResult {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useJobs(): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await api<Job[]>('/api/jobs');
      setJobs(data ?? []);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.message !== 'Unauthorized') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchJobs, 30_000);

  return { jobs, loading, error, refetch: fetchJobs };
}
