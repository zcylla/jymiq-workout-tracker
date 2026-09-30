import { desc, eq } from 'drizzle-orm';

import { db } from '../db';
import { exercises, personalRecords } from '../schema';

/** The Records timeline: every PR ever set, newest first. */
export function recordsQuery() {
  return db
    .select({
      id: personalRecords.id,
      category: personalRecords.category,
      value: personalRecords.value,
      previousValue: personalRecords.previousValue,
      weightKg: personalRecords.weightKg,
      reps: personalRecords.reps,
      achievedAt: personalRecords.achievedAt,
      exerciseId: personalRecords.exerciseId,
      exerciseName: exercises.name,
    })
    .from(personalRecords)
    .innerJoin(exercises, eq(exercises.id, personalRecords.exerciseId))
    .orderBy(desc(personalRecords.achievedAt));
}
