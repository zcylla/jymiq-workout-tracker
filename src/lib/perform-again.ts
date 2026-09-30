import type { Kg } from './units.ts';
import { type SetKind, wasPerformed } from './volume.ts';

export interface AgainPlanLine {
  exerciseId: string;
  sets: { kind: SetKind; weightKg: Kg | null; reps: number | null }[];
}

/**
 * What "perform again" copies from a finished session: the sets that were logged,
 * per exercise, in the order they were done. A set that was only ever pre-filled,
 * and an exercise with none logged, stay behind.
 *
 * `exercises` are the session's rows that were not removed; removal is the
 * caller's filter, not this function's.
 */
export function performAgainPlan(
  exercises: readonly { id: string; exerciseId: string; position: number }[],
  sets: readonly {
    sessionExerciseId: string;
    position: number;
    kind: SetKind;
    weightKg: Kg | null;
    reps: number | null;
    completedAt: number | null;
  }[],
): AgainPlanLine[] {
  const plan: AgainPlanLine[] = [];
  for (const ex of [...exercises].sort((a, b) => a.position - b.position)) {
    const done = sets
      .filter((s) => s.sessionExerciseId === ex.id && wasPerformed(s))
      .sort((a, b) => a.position - b.position)
      .map(({ kind, weightKg, reps }) => ({ kind, weightKg, reps }));
    if (done.length) plan.push({ exerciseId: ex.exerciseId, sets: done });
  }
  return plan;
}
