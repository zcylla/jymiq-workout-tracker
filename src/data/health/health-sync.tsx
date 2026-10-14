import { useEffect } from 'react';
import { AppState } from 'react-native';

import { syncWorkoutsSoon } from './export';

export function HealthSync() {
  useEffect(() => {
    syncWorkoutsSoon();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') syncWorkoutsSoon();
    });
    return () => sub.remove();
  }, []);
  return null;
}
