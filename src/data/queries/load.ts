import { and, eq, gte, isNotNull, lt, max, ne } from 'drizzle-orm';

import { db } from '../db';
import { exerciseMuscles, exercises, sessionExercises, sessions, sets } from '../schema';

/**
 * Every query here is `FROM sessions`: `useLiveQuery` subscribes only to the
 * table named in `FROM`, and a session is only counted once it stops being
 * `in_progress`, so finishing one is the write that has to refresh the tab.
 */
const logged = ne(sessions.status, 'in_progress');

/** Every set of every session in `[from, to)` — the tiles' sets and tonnage. */
export function rangeSetsQuery(from: number, to: number) {
  return db
    .select({
      startedAt: sessions.startedAt,
      kind: sets.kind,
      weightKg: sets.weightKg,
      reps: sets.reps,
      completedAt: sets.completedAt,
    })
    .from(sessions)
    .innerJoin(sessionExercises, eq(sessionExercises.sessionId, sessions.id))
    .innerJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .where(and(gte(sessions.startedAt, from), lt(sessions.startedAt, to), logged));
}

/** One row per set per muscle it is `prime` for. Counting happens in `lib/landmarks`. */
export function primeSetsQuery(from: number, to: number) {
  return db
    .select({
      muscle: exerciseMuscles.muscle,
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
        gte(sessions.startedAt, from),
        lt(sessions.startedAt, to),
        logged,
        eq(exerciseMuscles.role, 'prime'),
      ),
    );
}

/** Best stored e1RM per exercise per session, from `since` on. Warm-ups excluded. */
export function bestE1rmQuery(since: number) {
  return db
    .select({
      exerciseId: sessionExercises.exerciseId,
      name: exercises.name,
      sessionId: sessions.id,
      at: sessions.startedAt,
      bestE1rmKg: max(sets.e1rmKg),
    })
    .from(sessions)
    .innerJoin(sessionExercises, eq(sessionExercises.sessionId, sessions.id))
    .innerJoin(exercises, eq(exercises.id, sessionExercises.exerciseId))
    .innerJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .where(
      and(
        gte(sessions.startedAt, since),
        logged,
        isNotNull(sets.completedAt),
        isNotNull(sets.e1rmKg),
        ne(sets.kind, 'warmup'),
      ),
    )
    .groupBy(sessionExercises.id);
}

/** At most three ids: the deload call only needs to know whether there are three sessions. */
export function loggedSessionIdsQuery() {
  return db.select({ id: sessions.id }).from(sessions).where(logged).limit(3);
}
