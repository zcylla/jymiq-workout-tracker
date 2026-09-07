import type { Kg } from './units.ts';

export type SetKind = 'warmup' | 'working' | 'drop' | 'failure';

export interface SetLike {
  weightKg: Kg | null;
  reps: number | null;
  kind: SetKind;
  completedAt: number | null;
}

/** Tonnage for one set. A set that was never logged contributes nothing. */
export function setVolume(s: SetLike): Kg {
  if (s.completedAt == null || s.weightKg == null || s.reps == null) return 0;
  return s.weightKg * s.reps;
}

/**
 * Warm-ups are excluded by default: counting them inflates every
 * session-over-session delta the app draws.
 */
export function totalVolume(
  sets: readonly SetLike[],
  opts: { includeWarmup?: boolean } = {},
): Kg {
  return sets.reduce(
    (sum, s) => (opts.includeWarmup || s.kind !== 'warmup' ? sum + setVolume(s) : sum),
    0,
  );
}

export function countWorkingSets(sets: readonly SetLike[]): number {
  return sets.filter((s) => s.completedAt != null && s.kind !== 'warmup').length;
}

/** Heaviest completed working set; ties go to the one with more reps. */
export function topSet(sets: readonly SetLike[]): SetLike | null {
  let best: SetLike | null = null;
  for (const s of sets) {
    if (s.completedAt == null || s.kind === 'warmup' || s.weightKg == null) continue;
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
