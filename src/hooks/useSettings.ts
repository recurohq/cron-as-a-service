import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Settings } from '@/lib/types';

interface UseSettingsResult {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const defaultSettings: Settings = {
  default_notify_email: '',
  default_notify_url: '',
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_pass: '',
  smtp_from: '',
  retention_days: '30',
};

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await api<Settings>('/api/settings');
      setSettings({ ...defaultSettings, ...data });
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.message !== 'Unauthorized') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, refetch: fetchSettings };
}
