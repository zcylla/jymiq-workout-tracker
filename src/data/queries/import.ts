import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { requireNativeModule } from 'expo';
import { type DatabaseChangeEvent, openDatabaseSync } from 'expo-sqlite';

import type { ExportTables } from '@/lib/export';
import { RESTORE_ORDER, rowsForRestore } from '@/lib/import';

import migrations from '../../../drizzle/migrations';
import { sqlite } from '../db';
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
 * Restore replaces user data, preserves the built-in library and reseeds missing library rows.
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

/** Backup rows written, excluding preserved library rows and the seed repair. */
export function restoreBackup(tables: ExportTables): number {
  const events = requireNativeModule<{
    emit: (name: 'onDatabaseChange', event: DatabaseChangeEvent) => void;
  }>('ExpoSQLite');
  // Bulk row notifications overflow Android's JNI reference table before JS can drain them.
  const connection = openDatabaseSync('workout.db', {
    useNewConnection: true,
    enableChangeListener: false,
  });
  let written: number;
  try {
    connection.execSync('PRAGMA foreign_keys = ON;');
    written = drizzle(connection).transaction((tx) => {
      // Children first: foreign keys are ON, and `exercise_muscles` has a
      // composite primary key, so a half-applied restore is a real failure mode.
      for (const name of [...RESTORE_ORDER].reverse()) {
        if (name === 'exercises') {
          tx.delete(exercises).where(eq(exercises.isCustom, true)).run();
        } else if (name === 'exercise_muscles') {
          tx.delete(exerciseMuscles)
            .where(
              inArray(
                exerciseMuscles.exerciseId,
                tx.select({ id: exercises.id }).from(exercises).where(eq(exercises.isCustom, true)),
              ),
            )
            .run();
        } else tx.delete(TABLES[name]).run();
      }

      connection.execSync(migrations.migrations.m0001);
      const libraryIds = new Set(
        tx
          .select({ id: exercises.id })
          .from(exercises)
          .where(eq(exercises.isCustom, false))
          .all()
          .map((row) => row.id),
      );
      let written = 0;
      for (const name of RESTORE_ORDER) {
        const rows = rowsForRestore(name, tables[name] ?? [], libraryIds);
        for (let i = 0; i < rows.length; i += CHUNK) {
          tx.insert(TABLES[name])
            .values(rows.slice(i, i + CHUNK) as never)
            .run();
        }
        written += rows.length;
      }
      return written;
    });
  } finally {
    connection.closeSync();
  }
  for (const tableName of [...RESTORE_ORDER, 'sync_queue']) {
    events.emit('onDatabaseChange', {
      databaseName: 'workout.db',
      databaseFilePath: sqlite.databasePath,
      tableName,
      rowId: 0,
    });
  }
  return written;
}
