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

const grouped = (n: number): string =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+$)/g, ',');

const ABBREVIATE_FROM = 100_000;

const deviceLocale = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return 'en';
  }
};

const abbreviated = (n: number, locale: string): string => {
  const thousands = (Math.round(n / 100) / 10).toString();
  return locale.toLowerCase().startsWith('es') ? `${thousands} mil` : `${thousands}k`;
};

const figure = (n: number, locale: string): string =>
  Math.round(n) >= ABBREVIATE_FROM ? abbreviated(n, locale) : grouped(n);

/**
 * Always kg or lb, whole units, grouped from a thousand and abbreviated from a hundred
 * thousand: "820 KG", "10,500 KG", "123.5k KG", "123.5 mil KG" on a Spanish device.
 */
export function formatTonnage(kg: Kg, unit: Unit = 'kg', locale: string = deviceLocale()): string {
  return `${figure(toDisplay(kg, unit), locale)} ${unit === 'lb' ? 'LB' : 'KG'}`;
}

/** An axis label: above a thousand every label is a bare number ("22,600", "125k", "0"); the caption names the unit. */
export function formatTonnageAxis(
  kg: Kg,
  hiKg: Kg,
  unit: Unit = 'kg',
  locale: string = deviceLocale(),
): string {
  if (toDisplay(hiKg, unit) < 1000) return formatTonnage(kg, unit, locale);
  return figure(toDisplay(kg, unit), locale);
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
