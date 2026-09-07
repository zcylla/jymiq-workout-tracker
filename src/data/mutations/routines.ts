import { eq, sql } from 'drizzle-orm';

import { newId } from '@/lib/id';

import { db } from '../db';
import { routineExercises, routines } from '../schema';

export function createRoutine(input: { name: string; note?: string | null }): string {
  const id = newId();
  const now = Date.now();
  db.insert(routines)
    .values({
      id,
      name: input.name.trim(),
      note: input.note?.trim() || null,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return id;
}

export type NewRoutineExercise = {
  routineId: string;
  exerciseId: string;
  targetSets?: number;
  targetReps?: number | null;
  targetWeightKg?: number | null;
  restSec?: number | null;
  note?: string | null;
};

/**
 * Appends to the end. Position is read and written inside the transaction with
 * the routine's own `updatedAt`, so the list order and the row that owns it can
 * never disagree.
 */
export function addExerciseToRoutine(input: NewRoutineExercise): string {
  const id = newId();

  db.transaction((tx) => {
    const [last] = tx
      .select({ max: sql<number | null>`max(${routineExercises.position})` })
      .from(routineExercises)
      .where(eq(routineExercises.routineId, input.routineId))
      .all();

    tx.insert(routineExercises)
      .values({
        id,
        routineId: input.routineId,
        exerciseId: input.exerciseId,
        position: (last?.max ?? -1) + 1,
        targetSets: input.targetSets ?? 3,
        targetReps: input.targetReps ?? null,
        targetWeightKg: input.targetWeightKg ?? null,
        restSec: input.restSec ?? null,
        note: input.note ?? null,
      })
      .run();

    touch(tx, input.routineId);
  });

  return id;
}

export function updateRoutineExercise(
  id: string,
  patch: Partial<Omit<NewRoutineExercise, 'routineId' | 'exerciseId'>> & { position?: number },
): void {
  db.transaction((tx) => {
    const [row] = tx
      .update(routineExercises)
      .set(patch)
      .where(eq(routineExercises.id, id))
      .returning({ routineId: routineExercises.routineId })
      .all();
    if (row) touch(tx, row.routineId);
  });
}

/**
 * A hard delete: a routine line is a plan, not history. What was actually done
 * lives in `session_exercises`, which snapshots at session start and does not
 * point here.
 */
export function removeRoutineExercise(id: string): void {
  db.transaction((tx) => {
    const [row] = tx
      .delete(routineExercises)
      .where(eq(routineExercises.id, id))
      .returning({ routineId: routineExercises.routineId })
      .all();
    if (row) touch(tx, row.routineId);
  });
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function touch(tx: Tx, routineId: string): void {
  tx.update(routines).set({ updatedAt: Date.now() }).where(eq(routines.id, routineId)).run();
}
