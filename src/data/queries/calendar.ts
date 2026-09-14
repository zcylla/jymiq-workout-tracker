import { and, asc, gte, lt, ne } from 'drizzle-orm';

import { db } from '../db';
import { sessions } from '../schema';

/**
 * Every logged session inside one month, for the Load tab's calendar.
 *
 * `FROM sessions` with no join: `useLiveQuery` subscribes only to the table
 * named in the query's `FROM`, so reading the tonnage back off the session row
 * (written once inside the completion transaction) is also what keeps the grid
 * live. An in-progress session is excluded — it has no volume yet and nothing
 * to open.
 */
export function monthSessionsQuery(from: number, to: number) {
  return db
    .select({
      id: sessions.id,
      startedAt: sessions.startedAt,
      totalVolumeKg: sessions.totalVolumeKg,
    })
    .from(sessions)
    .where(
      and(
        gte(sessions.startedAt, from),
        lt(sessions.startedAt, to),
        ne(sessions.status, 'in_progress'), // isLoggedSession: an abandoned session was still trained
      ),
    )
    .orderBy(asc(sessions.startedAt));
}
