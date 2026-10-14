import { useEffect } from 'react';
import { AppState } from 'react-native';

import { syncHealthSoon } from './sync';

export function HealthSync() {
  useEffect(() => {
    syncHealthSoon();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') syncHealthSoon();
    });
    return () => sub.remove();
  }, []);
  return null;
}
