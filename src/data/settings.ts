import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import { type Settings, coerceSettings } from '@/lib/settings';

/**
 * Settings, read synchronously at launch.
 *
 * `kv-store` has a sync API, and using it here is the whole design: settings
 * decide how the first frame renders (a weight in kg or lb), so an async read
 * would make every screen either flash the wrong unit or grow a loading state
 * for a value that is already on disk.
 *
 * A module-level store with `useSyncExternalStore` rather than a provider:
 * mutations need to read these too (`resolveRestSec` runs inside a database
 * transaction, nowhere near React), and a provider cannot serve that.
 */
const KEY = 'settings.v1';

function read(): Settings {
  try {
    const raw = Storage.getItemSync(KEY);
    return coerceSettings(raw === null ? null : JSON.parse(raw));
  } catch {
    // A corrupt value is not worth taking the app down for; `coerceSettings`
    // already treats anything unreadable as "use the defaults".
    return coerceSettings(null);
  }
}

let current = read();
const listeners = new Set<() => void>();

/** For anything outside React — mutations, in particular. */
export const getSettings = (): Settings => current;

export function setSettings(patch: Partial<Settings>): void {
  const next = coerceSettings({ ...current, ...patch });
  current = next;
  // Write after the in-memory update, so a failed write cannot leave the screen
  // showing something the app is not using.
  Storage.setItemSync(KEY, JSON.stringify(next));
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings);
}
