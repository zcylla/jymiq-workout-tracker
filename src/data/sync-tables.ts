import { and, asc, count, eq, getTableColumns, inArray, or } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

import {
  type Col,
  chunk,
  parseQueueKey,
  type QueueEntry,
  type RowKey,
  SYNC_TABLES,
  type SyncTable,
} from '@/lib/sync';

import { db, sqlite } from './db';
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
  syncQueue,
} from './schema';

interface SyncTableInfo {
  table: SQLiteTable;
  keyCols: string[];
  cols: Col[];
}

const CHUNK = 100;

function info(table: SQLiteTable, keyCols: string[]): SyncTableInfo {
  const cols = Object.entries(getTableColumns(table)).map(([key, c]) => ({ key, name: c.name }));
  return { table, keyCols, cols };
}

export const SYNC_REGISTRY: Record<SyncTable, SyncTableInfo> = {
  exercises: info(exercises, ['id']),
  exercise_muscles: info(exerciseMuscles, ['exerciseId', 'muscle']),
  routines: info(routines, ['id']),
  routine_exercises: info(routineExercises, ['id']),
  programs: info(programs, ['id']),
  program_days: info(programDays, ['programId', 'weekday']),
  sessions: info(sessions, ['id']),
  session_exercises: info(sessionExercises, ['id']),
  sets: info(sets, ['id']),
  personal_records: info(personalRecords, ['id']),
  body_weights: info(bodyWeights, ['id']),
  check_ins: info(checkIns, ['id']),
};

/** The same filters the triggers in drizzle/0005 apply: only custom exercises and their muscles sync. */
const ENQUEUE_FILTER: Partial<Record<SyncTable, string>> = {
  exercises: 'WHERE is_custom = 1',
  exercise_muscles:
    'WHERE EXISTS (SELECT 1 FROM exercises e WHERE e.id = exercise_muscles.exercise_id AND e.is_custom = 1)',
};

export function readQueue(limit?: number): QueueEntry[] {
  const q = db.select().from(syncQueue).orderBy(asc(syncQueue.id));
  const rows = limit === undefined ? q.all() : q.limit(limit).all();
  const known: readonly string[] = SYNC_TABLES;
  const out: QueueEntry[] = [];
  const junk: number[] = [];
  for (const r of rows) {
    if (!known.includes(r.tableName)) {
      junk.push(r.id);
      continue;
    }
    out.push({ id: r.id, table: r.tableName as SyncTable, key: parseQueueKey(r.rowKey), op: r.op });
  }
  if (junk.length) clearQueue(junk);
  return out;
}

export function rowsForKeys(table: SyncTable, keys: RowKey[]): Record<string, unknown>[] {
  const { table: t, keyCols } = SYNC_REGISTRY[table];
  const columns = getTableColumns(t) as Record<string, Parameters<typeof eq>[0]>;
  const out: Record<string, unknown>[] = [];
  for (const part of chunk(keys, CHUNK)) {
    const where =
      keyCols.length === 1
        ? inArray(columns[keyCols[0]], part.map((k) => k[0]) as string[])
        : or(...part.map((k) => and(...keyCols.map((c, i) => eq(columns[c], k[i])))));
    out.push(...(db.select().from(t).where(where).all() as Record<string, unknown>[]));
  }
  return out;
}

export function clearQueue(entryIds: number[]): void {
  for (const part of chunk(entryIds, CHUNK)) {
    db.delete(syncQueue).where(inArray(syncQueue.id, part)).run();
  }
}

export function queueSize(): number {
  return db.select({ n: count() }).from(syncQueue).get()?.n ?? 0;
}

/** For the first push: every current row goes in as an upsert. */
export function enqueueEverything(): void {
  sqlite.withTransactionSync(() => {
    for (const name of SYNC_TABLES) {
      const { keyCols, cols } = SYNC_REGISTRY[name];
      const keyExpr = keyCols.map((k) => cols.find((c) => c.key === k)?.name).join(', ');
      sqlite.runSync(
        `INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at)
         SELECT '${name}', json_array(${keyExpr}), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000
         FROM ${name} ${ENQUEUE_FILTER[name] ?? ''}`,
      );
    }
  });
}
