import { asc, eq } from 'drizzle-orm';

import { db } from '../db';
import { programDays, programs, routines } from '../schema';

export function programListQuery() {
  return db.select().from(programs).orderBy(asc(programs.name));
}

/**
 * The one running program, or nothing.
 *
 * `FROM programs` on purpose: this is what has to notice an activate or a
 * pause, and `useLiveQuery` subscribes only to the table named in the `FROM`.
 * The schedule itself is a second query on `program_days` for the same reason —
 * one query joining the two would go live on whichever table drizzle put first
 * and stay stale on the other.
 */
export function activeProgramQuery() {
  return db.select().from(programs).where(eq(programs.status, 'active')).limit(1);
}

export function programQuery(id: string) {
  return db.select().from(programs).where(eq(programs.id, id)).limit(1);
}

/** A program's weekday slots, with the routine each one points at. */
export function programDaysQuery(programId: string) {
  return db
    .select({
      weekday: programDays.weekday,
      routineId: routines.id,
      name: routines.name,
    })
    .from(programDays)
    .innerJoin(routines, eq(routines.id, programDays.routineId))
    .where(eq(programDays.programId, programId))
    .orderBy(asc(programDays.weekday));
}
