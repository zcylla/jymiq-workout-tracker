import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { HealthStatus } from '@/lib/health';

import { connectHealth, openHealthSettings, openHealthStore, readHealthStatus } from './client';

export function useHealthStatus(): { status: HealthStatus | null; press: () => void } {
  const [status, setStatus] = useState<HealthStatus | null>(null);

  const refresh = useCallback(() => {
    readHealthStatus().then(setStatus);
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const press = useCallback(() => {
    if (status === 'not_connected' || status === 'partial') connectHealth().then(setStatus);
    else if (status === 'connected') openHealthSettings();
    else if (status === 'needs_update') openHealthStore();
  }, [status]);

  return { status, press };
}
