import { and, eq, sql } from 'drizzle-orm';

import { newId } from '@/lib/id';
import type { RoutineChange } from '@/lib/routine-diff';

import { db } from '../db';
import { programDays, routineExercises, routines } from '../schema';
import { getSettings } from '../settings';
import { syncSoon } from '../sync';

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
  return appendExercisesToRoutine(input.routineId, [input])[0];
}

export function addExercisesToRoutine(input: {
  routineId: string;
  exerciseIds: readonly string[];
}): void {
  if (!input.exerciseIds.length) return;
  const targetSets = getSettings().defaultSets;
  appendExercisesToRoutine(
    input.routineId,
    input.exerciseIds.map((exerciseId) => ({ routineId: input.routineId, exerciseId, targetSets })),
  );
}

function appendExercisesToRoutine(
  routineId: string,
  inputs: readonly NewRoutineExercise[],
): string[] {
  const ids = inputs.map(() => newId());

  db.transaction((tx) => {
    const [last] = tx
      .select({ max: sql<number | null>`max(${routineExercises.position})` })
      .from(routineExercises)
      .where(eq(routineExercises.routineId, routineId))
      .all();

    inputs.forEach((input, index) => {
      tx.insert(routineExercises)
        .values({
          id: ids[index],
          routineId,
          exerciseId: input.exerciseId,
          position: (last?.max ?? -1) + 1 + index,
          targetSets: input.targetSets ?? getSettings().defaultSets,
          targetReps: input.targetReps ?? null,
          targetWeightKg: input.targetWeightKg ?? null,
          restSec: input.restSec ?? null,
          note: input.note ?? null,
        })
        .run();
    });

    touch(tx, routineId);
  });

  return ids;
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

/**
 * Saves what a finished session changed back into its routine, in one transaction.
 * Every statement is scoped to `routineId` and skips a line that is gone, so a
 * stale or repeated change is a no-op. An add is skipped when the routine already
 * has that exercise with the same targets, which is what a second tap looks like.
 */
export function applyRoutineChanges(routineId: string, changes: readonly RoutineChange[]): void {
  if (!changes.length) return;
  db.transaction((tx) => {
    const routine = tx
      .select({ id: routines.id })
      .from(routines)
      .where(eq(routines.id, routineId))
      .get();
    if (!routine) return;

    const lines = tx
      .select()
      .from(routineExercises)
      .where(eq(routineExercises.routineId, routineId))
      .all();
    let position = Math.max(-1, ...lines.map((l) => l.position));
    const line = (id: string) =>
      and(eq(routineExercises.id, id), eq(routineExercises.routineId, routineId));

    for (const c of changes) {
      switch (c.kind) {
        case 'add': {
          const targets = {
            targetSets: c.targetSets,
            targetReps: c.targetReps,
            targetWeightKg: c.targetWeightKg,
          };
          const added = {
            id: newId(),
            routineId,
            exerciseId: c.exerciseId,
            position: ++position,
            ...targets,
            restSec: null,
            note: null,
          };
          tx.insert(routineExercises).values(added).run();
          break;
        }
        case 'remove':
          tx.delete(routineExercises).where(line(c.routineExerciseId)).run();
          break;
        case 'swap':
          tx.update(routineExercises)
            .set({
              exerciseId: c.toExerciseId,
              targetSets: c.targetSets,
              targetReps: c.targetReps,
              targetWeightKg: c.targetWeightKg,
            })
            .where(line(c.routineExerciseId))
            .run();
          break;
        case 'sets':
          tx.update(routineExercises)
            .set({ targetSets: c.to })
            .where(line(c.routineExerciseId))
            .run();
          break;
        case 'reps':
          tx.update(routineExercises)
            .set({ targetReps: c.to })
            .where(line(c.routineExerciseId))
            .run();
          break;
        case 'load':
          tx.update(routineExercises)
            .set({ targetWeightKg: c.toKg })
            .where(line(c.routineExerciseId))
            .run();
          break;
      }
    }

    touch(tx, routineId);
  });
  syncSoon();
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function touch(tx: Tx, routineId: string): void {
  tx.update(routines).set({ updatedAt: Date.now() }).where(eq(routines.id, routineId)).run();
}
