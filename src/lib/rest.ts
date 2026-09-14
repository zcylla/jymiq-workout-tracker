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

export function resolveRestSec(
  routineRestSec: number | null | undefined,
  exerciseRestSec: number | null | undefined,
  kind: ExerciseKind,
  defaults: RestDefaults = DEFAULT_REST_SEC,
): number {
  return routineRestSec ?? exerciseRestSec ?? defaults[kind];
}
