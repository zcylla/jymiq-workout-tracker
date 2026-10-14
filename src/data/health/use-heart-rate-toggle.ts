import { setSettings, useSettings } from '@/data/settings';

import { canReadHeartRate, connectHealth } from './client';
import { syncHealthSoon } from './sync';

export function useHeartRateToggle(): { on: boolean; toggle: (next: boolean) => void } {
  const on = useSettings().healthHeartRate;

  const toggle = (next: boolean) => {
    if (!next) {
      setSettings({ healthHeartRate: false });
      return;
    }
    connectHealth()
      .then(canReadHeartRate)
      .then((ok) => {
        if (!ok) return;
        setSettings({ healthHeartRate: true });
        syncHealthSoon();
      });
  };

  return { on, toggle };
}
