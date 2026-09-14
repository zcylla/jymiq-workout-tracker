import { and, eq, ne } from 'drizzle-orm';

import { newId } from '@/lib/id';

import { db } from '../db';
import { programDays, programs } from '../schema';

export function createProgram(input: { name: string; note?: string | null }): string {
  const id = newId();
  const now = Date.now();
  db.insert(programs)
    .values({
      id,
      name: input.name.trim(),
      note: input.note?.trim() || null,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return id;
}

export function renameProgram(id: string, input: { name: string; note?: string | null }): void {
  db.update(programs)
    .set({ name: input.name.trim(), note: input.note?.trim() || null, updatedAt: Date.now() })
    .where(eq(programs.id, id))
    .run();
}

/**
 * Activating one program pauses whichever was running.
 *
 * Both writes are in one transaction because a partial apply is a real failure
 * mode, not a hypothetical: `idx_programs_one_active` is a unique index, so
 * activating before pausing throws and leaves the old program running while the
 * screen has already navigated away.
 *
 * `startedAt` is written once and never reset. It is what stops a program
 * activated today from turning every past Monday into a missed day.
 */
export function activateProgram(id: string): void {
  const now = Date.now();
  db.transaction((tx) => {
    tx.update(programs)
      .set({ status: 'paused', updatedAt: now })
      .where(and(eq(programs.status, 'active'), ne(programs.id, id)))
      .run();

    const [current] = tx
      .select({ startedAt: programs.startedAt })
      .from(programs)
      .where(eq(programs.id, id))
      .all();

    tx.update(programs)
      .set({
        status: 'active',
        startedAt: current?.startedAt ?? now,
        updatedAt: now,
      })
      .where(eq(programs.id, id))
      .run();
  });
}

export function pauseProgram(id: string): void {
  db.update(programs)
    .set({ status: 'paused', updatedAt: Date.now() })
    .where(eq(programs.id, id))
    .run();
}

/**
 * Put a routine on a weekday, or clear the slot back to rest.
 *
 * A weekday with no row *is* rest, so clearing is a delete rather than a null —
 * one representation of one fact.
 */
export function setProgramDay(programId: string, weekday: number, routineId: string | null): void {
  const now = Date.now();
  db.transaction((tx) => {
    if (routineId === null) {
      tx.delete(programDays)
        .where(and(eq(programDays.programId, programId), eq(programDays.weekday, weekday)))
        .run();
    } else {
      tx.insert(programDays)
        .values({ programId, weekday, routineId })
        .onConflictDoUpdate({
          target: [programDays.programId, programDays.weekday],
          set: { routineId },
        })
        .run();
    }
    tx.update(programs).set({ updatedAt: now }).where(eq(programs.id, programId)).run();
  });
}

/** The days go with it — `program_days` cascades on the foreign key. */
export function deleteProgram(id: string): void {
  db.delete(programs).where(eq(programs.id, id)).run();
}
