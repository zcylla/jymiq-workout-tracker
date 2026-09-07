import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

/**
 * One database, opened synchronously at module scope.
 *
 * `enableChangeListener` is what makes `useLiveQuery` reactive — without it the
 * screens go stale on write and the bug looks like a caching problem.
 */
export const sqlite = openDatabaseSync('workout.db', { enableChangeListener: true });

// WAL is the documented default for anything that writes during use, which this
// does on every logged set.
sqlite.execSync('PRAGMA journal_mode = WAL;');
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

export type Db = typeof db;
