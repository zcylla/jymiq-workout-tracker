import type { Kg } from './units.ts';

export type SetKind = 'warmup' | 'working' | 'drop' | 'failure';

export interface SetLike {
  weightKg: Kg | null;
  reps: number | null;
  kind: SetKind;
  completedAt: number | null;
}

/**
 * Whether a set actually happened. `startSession` pre-fills every set's
 * `weightKg`/`reps` with the plan's target values at creation time, so a
 * populated row is not evidence of a lift — `completedAt` is the only marker
 * that the set was really performed.
 */
export function wasPerformed(s: SetLike): boolean {
  return s.completedAt != null;
}

/** Tonnage for one set. A set that was never logged contributes nothing. */
export function setVolume(s: SetLike): Kg {
  if (!wasPerformed(s) || s.weightKg == null || s.reps == null) return 0;
  return s.weightKg * s.reps;
}

/**
 * Warm-ups are excluded by default: counting them inflates every
 * session-over-session delta the app draws.
 */
export function totalVolume(sets: readonly SetLike[], opts: { includeWarmup?: boolean } = {}): Kg {
  return sets.reduce(
    (sum, s) => (opts.includeWarmup || s.kind !== 'warmup' ? sum + setVolume(s) : sum),
    0,
  );
}

export function countWorkingSets(sets: readonly SetLike[]): number {
  return sets.filter((s) => wasPerformed(s) && s.kind !== 'warmup').length;
}

/** Heaviest completed working set; ties go to the one with more reps. */
export function topSet(sets: readonly SetLike[]): SetLike | null {
  let best: SetLike | null = null;
  for (const s of sets) {
    if (!wasPerformed(s) || s.kind === 'warmup' || s.weightKg == null) continue;
    if (
      best == null ||
      s.weightKg > best.weightKg! ||
      (s.weightKg === best.weightKg && (s.reps ?? 0) > (best.reps ?? 0))
    ) {
      best = s;
    }
  }
  return best;
}

/** "8.6 T" above a tonne, "820 KG" below — the boards use both. */
export function formatTonnage(kg: Kg): string {
  if (kg >= 1000) return `${(Math.round(kg / 100) / 10).toFixed(1)} T`;
  return `${Math.round(kg)} KG`;
}

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

/**
 * A session that ended, however it ended, is part of your history: an
 * abandoned session's sets were still lifted and its records still stand.
 */
export function isLoggedSession(status: SessionStatus): boolean {
  return status !== 'in_progress';
}

/**
 * Only a finished session is a fair baseline for a "vs last time" delta —
 * comparing against a session you bailed on after two sets reports a
 * meaningless swing.
 */
export function isComparableSession(status: SessionStatus): boolean {
  return status === 'completed';
}
