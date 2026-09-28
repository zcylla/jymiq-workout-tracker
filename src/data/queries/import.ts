import type { ExportTables } from '@/lib/export';
import { RESTORE_ORDER } from '@/lib/import';

import { db } from '../db';
import {
  bodyWeights,
  checkIns,
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
 * Writing a backup back in. Restore **replaces**: every row in every table
 * is deleted and the file's rows take their place. Merging was rejected — the
 * ids are the same on both sides, so a merge is either a no-op or a silent
 * pick-a-winner, and neither is something you can reason about at the moment
 * you most need to.
 *
 * The caller writes a rollback export before calling this. That is the undo.
 */

const TABLES = {
  exercises,
  exercise_muscles: exerciseMuscles,
  routines,
  routine_exercises: routineExercises,
  programs,
  program_days: programDays,
  sessions,
  session_exercises: sessionExercises,
  sets,
  personal_records: personalRecords,
  body_weights: bodyWeights,
  check_ins: checkIns,
} as const;

/**
 * Rows per INSERT. SQLite binds one variable per column and `sets` has fifteen,
 * so 60 rows is ~900 variables — under the 999 floor that older builds compile
 * with. Exceeding it fails as "too many SQL variables" mid-transaction.
 */
const CHUNK = 60;

/** Total rows written. Compare it against the file's own counts. */
export function restoreBackup(tables: ExportTables): number {
  return db.transaction((tx) => {
    // Children first: foreign keys are ON, and `exercise_muscles` has a
    // composite primary key, so a half-applied restore is a real failure mode.
    for (const name of [...RESTORE_ORDER].reverse()) {
      tx.delete(TABLES[name]).run();
    }

    let written = 0;
    for (const name of RESTORE_ORDER) {
      const rows = tables[name] ?? [];
      for (let i = 0; i < rows.length; i += CHUNK) {
        tx.insert(TABLES[name])
          .values(rows.slice(i, i + CHUNK) as never)
          .run();
      }
      written += rows.length;
    }
    return written;
  });
}
