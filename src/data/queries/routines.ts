import { asc, eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { exercises, routineExercises, routines } from '../schema';

export function routineListQuery() {
  return db
    .select()
    .from(routines)
    .where(sql`${routines.archivedAt} is null`)
    .orderBy(asc(routines.position), asc(routines.name));
}

export function routineQuery(id: string) {
  return db.select().from(routines).where(eq(routines.id, id)).limit(1);
}

/** A routine's lifts, in order, with the exercise each one points at. */
export function routineExercisesQuery(routineId: string) {
  return db
    .select({
      id: routineExercises.id,
      position: routineExercises.position,
      targetSets: routineExercises.targetSets,
      targetReps: routineExercises.targetReps,
      targetWeightKg: routineExercises.targetWeightKg,
      restSec: routineExercises.restSec,
      exerciseId: exercises.id,
      name: exercises.name,
      kind: exercises.kind,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(exercises.id, routineExercises.exerciseId))
    .where(eq(routineExercises.routineId, routineId))
    .orderBy(asc(routineExercises.position));
}

/** Which exercises are already used by a routine — the library's first group. */
export function exerciseIdsInRoutinesQuery() {
  return db.selectDistinct({ id: routineExercises.exerciseId }).from(routineExercises);
}
