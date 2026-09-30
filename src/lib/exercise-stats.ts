import { loadForReps } from './e1rm.ts';
import { type Kg, toDisplay, type Unit } from './units.ts';
import { type SetLike, topSet, wasPerformed } from './volume.ts';

/** One logged set of one lift, with the start of the session it belongs to. */
export interface LoggedSet extends SetLike {
  sessionId: string;
  at: number;
  e1rmKg: Kg | null;
}

export interface RepMax {
  reps: number;
  weightKg: Kg | null;
  /** `set` was lifted, `est` comes from the best e1RM, null means there is nothing to say. */
  source: 'set' | 'est' | null;
  /** When the set was first lifted; null unless `source` is `set`. */
  at: number | null;
}

export interface ExerciseNumbers {
  bestE1rmKg: Kg | null;
  /** Whole display units over the best before the session that set it; null when there is none. */
  e1rmGain: number | null;
  topSetKg: Kg | null;
  /** Sessions with this lift inside the window. */
  sessions: number;
  perWeek: number | null;
}

/** Lab 39 Q1 draws the REP MAXES rows at these counts. */
export const REP_MAX_REPS = [1, 3, 5, 8] as const;

/** The SESSIONS tile's "/ 12 WK". */
export const WINDOW_WEEKS = 12;

const WEEK_MS = 7 * 86_400_000;

/**
 * The same sets that can set a record (`detectSetPrs`): performed, not a
 * warm-up, not a drop set, with a load and a rep.
 */
export function countsForRecord(s: SetLike): boolean {
  if (!wasPerformed(s) || s.kind === 'warmup' || s.kind === 'drop') return false;
  return s.weightKg != null && s.weightKg > 0 && s.reps != null && s.reps >= 1;
}

const bestE1rm = (sets: readonly LoggedSet[]): Kg | null =>
  sets.reduce<Kg | null>(
    (best, s) => (s.e1rmKg != null && (best == null || s.e1rmKg > best) ? s.e1rmKg : best),
    null,
  );

/**
 * Rep maxes: the heaviest set at exactly that many reps. A count never lifted
 * is estimated from the best e1RM and marked as an estimate, never drawn like a
 * set you lifted.
 */
export function repMaxes(all: readonly LoggedSet[]): RepMax[] {
  const sets = all.filter(countsForRecord);
  const estimate = bestE1rm(sets);
  return REP_MAX_REPS.map((reps) => {
    let best: LoggedSet | null = null;
    for (const s of sets) {
      if (s.reps !== reps) continue;
      if (
        best == null ||
        s.weightKg! > best.weightKg! ||
        (s.weightKg === best.weightKg && s.at < best.at)
      )
        best = s;
    }
    if (best) return { reps, weightKg: best.weightKg, source: 'set', at: best.at };
    if (estimate != null)
      return { reps, weightKg: loadForReps(estimate, reps), source: 'est', at: null };
    return { reps, weightKg: null, source: null, at: null };
  });
}

/**
 * The YOUR NUMBERS tiles. Frequency divides by the weeks the lift has existed
 * in the log, capped at the window: dividing a three-week-old lift by twelve
 * would report a rate nobody trained at. Under a week there is no rate.
 */
export function exerciseNumbers(
  all: readonly LoggedSet[],
  now: number,
  unit: Unit,
): ExerciseNumbers {
  const sets = all.filter(countsForRecord);
  const best = bestE1rm(sets);

  let e1rmGain: number | null = null;
  if (best != null) {
    const firstAt = Math.min(...sets.filter((s) => s.e1rmKg === best).map((s) => s.at));
    const before = bestE1rm(sets.filter((s) => s.at < firstAt));
    if (before != null) {
      const gain = Math.round(toDisplay(best, unit)) - Math.round(toDisplay(before, unit));
      if (gain > 0) e1rmGain = gain;
    }
  }

  const windowStart = now - WINDOW_WEEKS * WEEK_MS;
  const sessions = new Set(sets.filter((s) => s.at >= windowStart).map((s) => s.sessionId)).size;
  const span = sets.length ? now - Math.min(...sets.map((s) => s.at)) : 0;
  const perWeek = span < WEEK_MS ? null : sessions / Math.min(WINDOW_WEEKS, span / WEEK_MS);

  return {
    bestE1rmKg: best,
    e1rmGain,
    topSetKg: topSet(sets)?.weightKg ?? null,
    sessions,
    perWeek,
  };
}
