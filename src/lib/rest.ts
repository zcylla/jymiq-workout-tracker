/** Mirrors `exercises.kind`. `src/lib` is pure, so it cannot import the schema. */
export type ExerciseKind = 'compound' | 'isolation';

/**
 * Rest between sets, resolved routine → exercise → kind default.
 *
 * The kind defaults are the fallback of last resort, and they are deliberately
 * far apart: a compound taken to within a couple of reps of failure needs
 * minutes, a curl does not. Settings will own these once it is written; until
 * then this is the only place they exist.
 */
export const DEFAULT_REST_SEC = { compound: 180, isolation: 90 } as const;

export function resolveRestSec(
  routineRestSec: number | null | undefined,
  exerciseRestSec: number | null | undefined,
  kind: ExerciseKind,
): number {
  return routineRestSec ?? exerciseRestSec ?? DEFAULT_REST_SEC[kind];
}
