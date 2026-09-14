import { isNotNull, max, ne } from 'drizzle-orm';

import { db } from '../db';
import { sessions } from '../schema';

/**
 * When each routine was last trained.
 *
 * `FROM sessions` on purpose. `useLiveQuery` subscribes only to the table named
 * in the query's `FROM`, so grouping the other way round — from `routines`,
 * joined out to sessions — would give a NEXT card that never notices you
 * finishing a workout. The routines themselves come from `routineListQuery`,
 * which is live on `routines`, and the two are married in JS by `pickNextRoutine`.
 */
export function lastRunPerRoutineQuery() {
  return db
    .select({
      routineId: sessions.routineId,
      lastRunAt: max(sessions.startedAt),
    })
    .from(sessions)
    .where(ne(sessions.status, 'in_progress')) // isLoggedSession: an abandoned session was still trained
    .groupBy(sessions.routineId)
    .having(isNotNull(sessions.routineId));
}
