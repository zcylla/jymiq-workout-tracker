import type { ExportTables } from '@/lib/export';

import { db } from '../db';
import {
  bodyWeights,
  exerciseMuscles,
  exercises,
  personalRecords,
  programDays,
  programs,
  routineExercises,
  routines,
  sessionExercises,
  sessions,
  sets,
} from '../schema';

/**
 * Every row in the database, for the backup file.
 *
 * Synchronous on purpose: `expo-sqlite` reads sync, the whole database is a few
 * hundred KB, and an async read here would only add a spinner to something that
 * finishes before the frame does.
 *
 * The table names are the wire format — they land in the file as keys, so
 * renaming one is a version bump in `src/lib/export.ts`.
 */
export function readAllTables(): ExportTables {
  return {
    exercises: db.select().from(exercises).all(),
    exercise_muscles: db.select().from(exerciseMuscles).all(),
    routines: db.select().from(routines).all(),
    routine_exercises: db.select().from(routineExercises).all(),
    programs: db.select().from(programs).all(),
    program_days: db.select().from(programDays).all(),
    sessions: db.select().from(sessions).all(),
    session_exercises: db.select().from(sessionExercises).all(),
    sets: db.select().from(sets).all(),
    personal_records: db.select().from(personalRecords).all(),
    body_weights: db.select().from(bodyWeights).all(),
  };
}
