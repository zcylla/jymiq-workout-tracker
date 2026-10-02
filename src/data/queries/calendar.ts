import { and, asc, gte, lt, ne } from 'drizzle-orm';

import { db } from '../db';
import { sessions } from '../schema';

/**
 * Every logged session inside a date range — History's calendar asks for a
 * month, Today's week strip asks for three weeks.
 *
 * `FROM sessions` with no join: `useLiveQuery` subscribes only to the table
 * named in the query's `FROM`, so reading the tonnage back off the session row
 * (written once inside the completion transaction) is also what keeps the grid
 * live. An in-progress session is excluded — it has no volume yet and nothing
 * to open.
 */
export function sessionsInRangeQuery(from: number, to: number) {
  return db
    .select({
      id: sessions.id,
      name: sessions.name,
      startedAt: sessions.startedAt,
      totalVolumeKg: sessions.totalVolumeKg,
      durationSec: sessions.durationSec,
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

export function loggedSessionTimestampsQuery() {
  return db
    .select({ startedAt: sessions.startedAt })
    .from(sessions)
    .where(ne(sessions.status, 'in_progress'));
}
