import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import { type GlassTrial, coerceTrial } from '@/lib/glass-trial';

/** The glass lab's pick, read synchronously for the same reason settings are: it decides the first frame. */
const KEY = 'glass-trial.v1';

function read(): GlassTrial {
  try {
    const raw = Storage.getItemSync(KEY);
    return coerceTrial(raw === null ? null : JSON.parse(raw));
  } catch {
    return coerceTrial(null);
  }
}

let current = read();
const listeners = new Set<() => void>();

const getGlassTrial = (): GlassTrial => current;

export function setGlassTrial(patch: Partial<GlassTrial>): void {
  current = coerceTrial({ ...current, ...patch });
  Storage.setItemSync(KEY, JSON.stringify(current));
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGlassTrial(): GlassTrial {
  return useSyncExternalStore(subscribe, getGlassTrial);
}
