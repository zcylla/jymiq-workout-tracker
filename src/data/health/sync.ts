import * as Sentry from '@sentry/react-native';

import { syncWorkouts } from './export';
import { syncHeartRate } from './heart-rate';

let running = false;
let again = false;

async function syncHealth(): Promise<void> {
  await syncWorkouts().catch((e) => Sentry.captureException(e));
  await syncHeartRate().catch((e) => Sentry.captureException(e));
}

export function syncHealthSoon(): void {
  if (running) {
    again = true;
    return;
  }
  running = true;
  syncHealth().finally(() => {
    running = false;
    if (again) {
      again = false;
      syncHealthSoon();
    }
  });
}
