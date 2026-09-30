import { eq, sql } from 'drizzle-orm';

import { newId } from '@/lib/id';

import { db } from '../db';
import { programDays, routineExercises, routines } from '../schema';
import { getSettings } from '../settings';

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

export function updateRoutine(id: string, input: { name: string; note?: string | null }): void {
  db.update(routines)
    .set({
      name: input.name.trim(),
      note: input.note?.trim() || null,
      updatedAt: Date.now(),
    })
    .where(eq(routines.id, id))
    .run();
}

export function renameRoutine(id: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Enter a routine name.');
  db.update(routines)
    .set({ name: trimmed, updatedAt: Date.now() })
    .where(eq(routines.id, id))
    .run();
}

export function duplicateRoutine(id: string): string {
  const copyId = newId();
  db.transaction((tx) => {
    const original = tx.select().from(routines).where(eq(routines.id, id)).get();
    if (!original) throw new Error('This routine is no longer available.');
    const now = Date.now();
    tx.insert(routines)
      .values({
        ...original,
        id: copyId,
        name: `${original.name} copy`,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    const lifts = tx
      .select()
      .from(routineExercises)
      .where(eq(routineExercises.routineId, id))
      .all();
    for (const lift of lifts) {
      tx.insert(routineExercises)
        .values({ ...lift, id: newId(), routineId: copyId })
        .run();
    }
  });
  return copyId;
}

export function deleteRoutine(id: string): void {
  db.transaction((tx) => {
    const scheduled = tx
      .select()
      .from(programDays)
      .where(eq(programDays.routineId, id))
      .limit(1)
      .get();
    if (scheduled)
      throw new Error(
        'This routine is used by a program. Replace it or set its days to Rest in the program before deleting it.',
      );
    tx.delete(routines).where(eq(routines.id, id)).run();
  });
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
        targetSets: input.targetSets ?? getSettings().defaultSets,
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

/** The grip on a routine's lifts. Positions are rewritten wholesale, in order. */
export function reorderRoutineExercises(orderedIds: readonly string[]): void {
  db.transaction((tx) => {
    let routineId: string | undefined;
    orderedIds.forEach((id, position) => {
      const [row] = tx
        .update(routineExercises)
        .set({ position })
        .where(eq(routineExercises.id, id))
        .returning({ routineId: routineExercises.routineId })
        .all();
      routineId ??= row?.routineId;
    });
    if (routineId) touch(tx, routineId);
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
