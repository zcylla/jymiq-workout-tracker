import { and, asc, desc, eq, isNotNull, isNull, like, max, ne, sql } from 'drizzle-orm';

import { db } from '../db';
import {
  type Equipment,
  exerciseMuscles,
  exercises,
  sessionExercises,
  sessions,
  sets,
} from '../schema';

/**
 * Query builders, not results: they are handed to `useLiveQuery`, which
 * re-runs them when the tables change, so a mutation refreshes every list that
 * reads it without anything invalidating anything.
 */
export function exerciseListQuery(opts: { search?: string; equipment?: Equipment | null } = {}) {
  const search = opts.search?.trim();
  return db
    .select({
      id: exercises.id,
      name: exercises.name,
      equipment: exercises.equipment,
      kind: exercises.kind,
      isFavorite: exercises.isFavorite,
    })
    .from(exercises)
    .where(
      and(
        sql`${exercises.archivedAt} is null`,
        opts.equipment ? eq(exercises.equipment, opts.equipment) : undefined,
        search ? like(exercises.name, `%${search}%`) : undefined,
      ),
    )
    .orderBy(asc(exercises.name));
}

export function exerciseQuery(id: string) {
  return db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
}

export function exerciseMusclesQuery(id: string) {
  return db.select().from(exerciseMuscles).where(eq(exerciseMuscles.exerciseId, id));
}

/** The library header's count. */
export function exerciseCountQuery() {
  return db
    .select({ n: sql<number>`count(*)`.as('n') })
    .from(exercises)
    .where(sql`${exercises.archivedAt} is null`);
}

/** Best stored e1RM of one lift per logged session, newest ten. `FROM sessions`: finishing one is the write that refreshes it. */
export function exerciseE1rmQuery(exerciseId: string) {
  return db
    .select({ at: sessions.startedAt, bestE1rmKg: max(sets.e1rmKg) })
    .from(sessions)
    .innerJoin(sessionExercises, eq(sessionExercises.sessionId, sessions.id))
    .innerJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .where(
      and(
        ne(sessions.status, 'in_progress'),
        eq(sessionExercises.exerciseId, exerciseId),
        isNotNull(sets.completedAt),
        isNotNull(sets.e1rmKg),
        ne(sets.kind, 'warmup'),
      ),
    )
    .groupBy(sessions.id)
    .orderBy(desc(sessions.startedAt))
    .limit(10);
}

/** Every logged set of one lift, for the YOUR NUMBERS tiles and REP MAXES. `src/lib/exercise-stats.ts` decides which ones count. */
export function exerciseSetsQuery(exerciseId: string) {
  return db
    .select({
      sessionId: sessions.id,
      at: sessions.startedAt,
      weightKg: sets.weightKg,
      reps: sets.reps,
      kind: sets.kind,
      completedAt: sets.completedAt,
      e1rmKg: sets.e1rmKg,
    })
    .from(sessions)
    .innerJoin(sessionExercises, eq(sessionExercises.sessionId, sessions.id))
    .innerJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .where(
      and(
        ne(sessions.status, 'in_progress'),
        eq(sessionExercises.exerciseId, exerciseId),
        isNull(sessionExercises.removedAt),
        isNotNull(sets.completedAt),
      ),
    );
}
