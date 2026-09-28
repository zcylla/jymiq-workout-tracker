import { muscleName } from './landmarks.ts';
import { type SetKind, wasPerformed } from './volume.ts';

export interface MuscleSet {
  muscle: string;
  role: 'prime' | 'assist';
  kind: SetKind;
  weightKg: number | null;
  reps: number | null;
  completedAt: number | null;
}

export const FATIGUE_HALF_LIFE_H = 48;
export const ASSIST_WEIGHT = 0.5;
export const WINDOW_DAYS = 7;

const HOUR = 3_600_000;

function inWindow(s: MuscleSet, now: number): s is MuscleSet & { completedAt: number } {
  return (
    wasPerformed(s) &&
    s.kind !== 'warmup' &&
    now - (s.completedAt as number) <= WINDOW_DAYS * 24 * HOUR
  );
}

export function loadByMuscle(sets: readonly MuscleSet[], now: number): Map<string, number> {
  const load = new Map<string, number>();
  for (const s of sets) {
    if (!inWindow(s, now)) continue;
    const hours = Math.max(0, now - s.completedAt) / HOUR;
    const w = (s.role === 'prime' ? 1 : ASSIST_WEIGHT) * 2 ** (-hours / FATIGUE_HALF_LIFE_H);
    load.set(s.muscle, (load.get(s.muscle) ?? 0) + w);
  }
  return load;
}

export function relativeLoad(load: Map<string, number>): Map<string, number> {
  const max = Math.max(0, ...load.values());
  return new Map([...load].map(([m, v]) => [m, max > 0 ? v / max : 0]));
}

export function hardest(
  sets: readonly MuscleSet[],
  now: number,
  n = 4,
): { muscle: string; name: string; sets: number; relative: number }[] {
  const load = loadByMuscle(sets, now);
  const relative = relativeLoad(load);
  const primeSets = new Map<string, number>();
  for (const s of sets) {
    if (s.role === 'prime' && inWindow(s, now)) {
      primeSets.set(s.muscle, (primeSets.get(s.muscle) ?? 0) + 1);
    }
  }
  return [...load]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([muscle]) => ({
      muscle,
      name: muscleName(muscle),
      sets: primeSets.get(muscle) ?? 0,
      relative: relative.get(muscle) ?? 0,
    }));
}
