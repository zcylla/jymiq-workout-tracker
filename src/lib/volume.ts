import { toDisplay, type Kg, type Unit } from './units.ts';

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

/**
 * Every set actually logged, warm-ups included — the question "did anything
 * happen in this session", which decides whether leaving it is a discard or a
 * decision.
 *
 * Deliberately not `countWorkingSets`: that one drops warm-ups because they
 * inflate a volume delta, and a session whose only logged set was a warm-up is
 * still a session you did something in. Confusing the two would silently delete
 * it.
 */
export function countLoggedSets(sets: readonly SetLike[]): number {
  return sets.filter(wasPerformed).length;
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

/** "8.6 T" above a tonne, "820 KG" below — the boards use both. Pounds: "18.9 K LB" / "820 LB". */
export function formatTonnage(kg: Kg, unit: Unit = 'kg'): string {
  if (unit === 'lb') {
    const lb = toDisplay(kg, 'lb');
    if (lb >= 1000) return `${(Math.round(lb / 100) / 10).toFixed(1)} K LB`;
    return `${Math.round(lb)} LB`;
  }
  if (kg >= 1000) return `${(Math.round(kg / 100) / 10).toFixed(1)} T`;
  return `${Math.round(kg)} KG`;
}

/** An axis label: every label shares the top one's scale ("22.6 T" over a bare "0", never "0 KG"). */
export function formatTonnageAxis(kg: Kg, hiKg: Kg, unit: Unit = 'kg'): string {
  const lb = unit === 'lb';
  if ((lb ? toDisplay(hiKg, 'lb') : hiKg) < 1000) return formatTonnage(kg, unit);
  if (kg === 0) return '0';
  const big = Math.round(((lb ? toDisplay(kg, 'lb') : kg) / 1000) * 10) / 10;
  return `${big.toFixed(1)} ${lb ? 'K LB' : 'T'}`;
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
