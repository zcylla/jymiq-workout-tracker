/** Mirrors `exercises.kind`. `src/lib` is pure, so it cannot import the schema. */
export type ExerciseKind = 'compound' | 'isolation';

/**
 * Rest between sets, resolved routine → exercise → kind default.
 *
 * The kind defaults are the fallback of last resort, and they are deliberately
 * far apart: a compound taken to within a couple of reps of failure needs
 * minutes, a curl does not. Settings owns them now; these are what it ships
 * with, and what this function falls back to when no caller supplies any.
 */
export const DEFAULT_REST_SEC = { compound: 180, isolation: 90 } as const;

export interface RestDefaults {
  compound: number;
  isolation: number;
}

export interface RestSweep {
  restUntil: number;
  loggedSets: number;
  spanMs: number;
}

export function updateRestSweep(
  previous: RestSweep | null,
  restUntil: number,
  loggedSets: number,
  nowMs: number,
): RestSweep {
  const remaining = Math.max(0, restUntil - nowMs);
  const startsNew =
    previous == null ||
    loggedSets > previous.loggedSets ||
    (previous.restUntil <= nowMs && restUntil !== previous.restUntil);
  const spanMs = startsNew
    ? remaining
    : Math.max(0, previous.spanMs + restUntil - previous.restUntil);
  return { restUntil, loggedSets, spanMs };
}

export function restProgress(sweep: RestSweep | null, nowMs: number): number {
  'worklet';
  if (sweep == null || sweep.spanMs <= 0) return 0;
  return Math.max(0, Math.min(1, (sweep.restUntil - nowMs) / sweep.spanMs));
}

export function adjustRestUntil(
  restUntil: number | null,
  nowMs: number,
  deltaSec: number,
): number | null {
  if (restUntil == null) return null;
  const endMs =
    (deltaSec > 0 ? Math.max(restUntil, nowMs) : restUntil) + Math.round(deltaSec * 1000);
  return endMs > nowMs ? endMs : null;
}

export function resolveRestSec(
  routineRestSec: number | null | undefined,
  exerciseRestSec: number | null | undefined,
  kind: ExerciseKind,
  defaults: RestDefaults = DEFAULT_REST_SEC,
): number {
  return routineRestSec ?? exerciseRestSec ?? defaults[kind];
}
