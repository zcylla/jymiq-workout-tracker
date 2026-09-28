import { and, desc, eq, gte, ne } from 'drizzle-orm';

import { db } from '../db';
import {
  checkIns,
  exerciseMuscles,
  routineExercises,
  sessionExercises,
  sessions,
  sets,
} from '../schema';

/** The newest check-in at or after `from` — Today passes the start of the local day. */
export function latestCheckInQuery(from: number) {
  return db
    .select()
    .from(checkIns)
    .where(gte(checkIns.at, from))
    .orderBy(desc(checkIns.at))
    .limit(1);
}

/** The muscles a routine is mainly for, from the exercises it holds. */
export function routinePrimeMusclesQuery(routineId: string) {
  return db
    .selectDistinct({ muscle: exerciseMuscles.muscle })
    .from(routineExercises)
    .innerJoin(exerciseMuscles, eq(exerciseMuscles.exerciseId, routineExercises.exerciseId))
    .where(and(eq(routineExercises.routineId, routineId), eq(exerciseMuscles.role, 'prime')));
}

/**
 * `primeSetsQuery`'s rows since `from`, with the session's start so the caller
 * can say which day each muscle was last worked. `FROM sessions` for the same
 * live-query reason.
 */
export function recentPrimeSetsQuery(from: number) {
  return db
    .select({
      muscle: exerciseMuscles.muscle,
      kind: sets.kind,
      weightKg: sets.weightKg,
      reps: sets.reps,
      completedAt: sets.completedAt,
      startedAt: sessions.startedAt,
    })
    .from(sessions)
    .innerJoin(sessionExercises, eq(sessionExercises.sessionId, sessions.id))
    .innerJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .innerJoin(exerciseMuscles, eq(exerciseMuscles.exerciseId, sessionExercises.exerciseId))
    .where(
      and(
        gte(sessions.startedAt, from),
        ne(sessions.status, 'in_progress'),
        eq(exerciseMuscles.role, 'prime'),
      ),
    );
}
