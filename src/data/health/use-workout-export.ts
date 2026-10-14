import { setSettings, useSettings } from '@/data/settings';

import { canSyncWorkouts, connectHealth } from './client';
import { syncWorkoutsSoon } from './export';

export function useWorkoutExport(): { on: boolean; toggle: (next: boolean) => void } {
  const on = useSettings().healthExportSince !== null;

  const toggle = (next: boolean) => {
    if (!next) {
      setSettings({ healthExportSince: null });
      return;
    }
    connectHealth()
      .then(canSyncWorkouts)
      .then((ok) => {
        if (!ok) return;
        setSettings({ healthExportSince: Date.now() });
        syncWorkoutsSoon();
      });
  };

  return { on, toggle };
}
