import { and, asc, eq, like, sql } from 'drizzle-orm';

import { db } from '../db';
import { type Equipment, exerciseMuscles, exercises } from '../schema';

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
