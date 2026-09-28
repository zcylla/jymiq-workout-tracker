import { and, eq, gte, isNotNull, ne } from 'drizzle-orm';

import { db } from '../db';
import { exerciseMuscles, sessionExercises, sessions, sets } from '../schema';

/** One row per performed set per muscle it works. The decay happens in `lib/fatigue`. */
export function fatigueSetsQuery(from: number) {
  return db
    .select({
      muscle: exerciseMuscles.muscle,
      role: exerciseMuscles.role,
      kind: sets.kind,
      weightKg: sets.weightKg,
      reps: sets.reps,
      completedAt: sets.completedAt,
    })
    .from(sessions)
    .innerJoin(sessionExercises, eq(sessionExercises.sessionId, sessions.id))
    .innerJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .innerJoin(exerciseMuscles, eq(exerciseMuscles.exerciseId, sessionExercises.exerciseId))
    .where(
      and(
        ne(sessions.status, 'in_progress'),
        isNotNull(sets.completedAt),
        gte(sets.completedAt, from),
      ),
    );
}
