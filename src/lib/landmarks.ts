import { type SetLike, countWorkingSets } from './volume.ts';

export interface Landmark {
  low: number;
  high: number;
  cap: number;
}

export const CHEST: Landmark = { low: 8, high: 14, cap: 20 };
export const BACK: Landmark = { low: 10, high: 18, cap: 25 };
export const QUADS: Landmark = { low: 8, high: 16, cap: 20 };
export const HAMSTRINGS: Landmark = { low: 6, high: 14, cap: 18 };
export const SHOULDERS: Landmark = { low: 6, high: 16, cap: 22 };

/** Weekly working sets. Only these five exist; no other muscle has a real denominator. */
export const LANDMARKS: Readonly<Record<string, Landmark>> = {
  chest: CHEST,
  back: BACK,
  quads: QUADS,
  hamstrings: HAMSTRINGS,
  shoulders: SHOULDERS,
};

const LANDMARK_ORDER = Object.keys(LANDMARKS);

export type VerdictTone = 'tick2' | 'done' | 'accent' | 'live';
export interface Verdict {
  word: 'TOO FEW' | 'GOOD' | 'HARD' | 'TOO MUCH';
  tone: VerdictTone;
}

export function verdict(sets: number, l: Landmark): Verdict {
  if (sets < l.low) return { word: 'TOO FEW', tone: 'tick2' };
  if (sets <= l.high) return { word: 'GOOD', tone: 'done' };
  if (sets < l.cap) return { word: 'HARD', tone: 'accent' };
  return { word: 'TOO MUCH', tone: 'live' };
}

/** Position on a zone bar, as a percentage of the cap. */
export const barPct = (v: number, cap: number): number => Math.min(100, (100 * v) / cap);

const NAMES: Record<string, string> = { lower_back: 'Lower back' };

export function muscleName(muscle: string): string {
  return NAMES[muscle] ?? muscle.charAt(0).toUpperCase() + muscle.slice(1);
}

export interface MuscleRow {
  muscle: string;
  name: string;
  sets: number;
  landmark: Landmark | null;
  verdict: Verdict | null;
}

export interface MuscleSet extends SetLike {
  muscle: string;
}

/**
 * Landmarked muscles first in landmark order, then the rest by sets descending.
 * A muscle's sets are this week's completed non-warm-up sets on exercises where
 * it is `prime`; `assist` does not count (the query filters the role).
 */
export function muscleRows(rows: readonly MuscleSet[]): MuscleRow[] {
  const by = new Map<string, SetLike[]>();
  for (const r of rows) {
    const list = by.get(r.muscle);
    if (list) list.push(r);
    else by.set(r.muscle, [r]);
  }
  const out: MuscleRow[] = [];
  for (const [muscle, list] of by) {
    const sets = countWorkingSets(list);
    if (sets === 0) continue;
    const landmark = LANDMARKS[muscle] ?? null;
    out.push({
      muscle,
      name: muscleName(muscle),
      sets,
      landmark,
      verdict: landmark ? verdict(sets, landmark) : null,
    });
  }
  const rank = (m: string) => {
    const i = LANDMARK_ORDER.indexOf(m);
    return i === -1 ? Number.POSITIVE_INFINITY : i;
  };
  return out.sort((a, b) => rank(a.muscle) - rank(b.muscle) || b.sets - a.sets);
}
