import { eq } from 'drizzle-orm';

import { newId } from '@/lib/id';
import type { Answers } from '@/lib/readiness';

import { db } from '../db';
import { checkIns } from '../schema';

const SLEEP = ['poor', 'ok', 'good'];
const SORENESS = ['none', 'some', 'a_lot'];
const ENERGY = ['low', 'ok', 'good'];

/**
 * Store a check-in. Without an id it inserts and returns the new id; with one
 * it rewrites that row's answers, so changing your mind is not a second row.
 * The enums are the trust boundary: SQLite would store any string.
 */
export function saveCheckIn(answers: Answers, id?: string): string {
  if (
    !SLEEP.includes(answers.sleep) ||
    !SORENESS.includes(answers.soreness) ||
    !ENERGY.includes(answers.energy)
  ) {
    throw new Error('Invalid check-in answer');
  }
  const now = Date.now();
  if (id) {
    db.update(checkIns)
      .set({
        sleep: answers.sleep,
        soreness: answers.soreness,
        energy: answers.energy,
        updatedAt: now,
      })
      .where(eq(checkIns.id, id))
      .run();
    return id;
  }
  const created = newId();
  db.insert(checkIns)
    .values({ id: created, at: now, ...answers, createdAt: now, updatedAt: now })
    .run();
  return created;
}
