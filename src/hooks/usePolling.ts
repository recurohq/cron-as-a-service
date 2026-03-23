import { useEffect, useCallback, useRef } from 'react';

export function usePolling(callback: () => void, intervalMs: number = 30_000, skipInitial: boolean = false) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const tick = useCallback(() => {
    callbackRef.current();
  }, []);

  useEffect(() => {
    if (!skipInitial) {
      tick();
    }

    const id = setInterval(() => {
      if (!document.hidden) {
        tick();
      }
    }, intervalMs);

    const handleVisibility = () => {
      if (!document.hidden) {
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [tick, intervalMs, skipInitial]);
}
