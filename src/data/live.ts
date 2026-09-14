import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import type { AnySQLiteSelect } from 'drizzle-orm/sqlite-core';

/**
 * `useLiveQuery`, with the loading state in the type.
 *
 * `useLiveQuery().data` is `[]` **both** while the query is in flight and when
 * it genuinely matched nothing; `updatedAt === undefined` is the only thing
 * separating them. That is written down in `AGENTS.md`, and writing it down has
 * not been enough — the same mistake has now shipped more than once, because
 * `data ?? []` is the shorter thing to type and it reads as correct:
 *
 *   - the live screen counted logged sets off an unloaded query and would have
 *     **deleted a session** that had work in it;
 *   - Today decided "no routines yet" from an unloaded list, so the screen the
 *     app opens on flashed its empty state on every launch;
 *   - Start refused with "add an exercise first" for a routine whose lifts had
 *     simply not arrived.
 *
 * None of those fail as an error. They fail as plausible, confident, wrong
 * answers, which no typecheck, lint or test sees.
 *
 * So: **`null` means "has not answered yet"**, and an array always means an
 * answer. Anything that branches on the rows being empty then has to say what
 * it does about `null`, because `null` is not an array and `tsc` will not let
 * it pretend otherwise.
 *
 * `useLiveQuery(...).data ?? []` is still fine where nothing branches — a list
 * the screen only maps over renders empty for a frame and then fills, which is
 * what it should do.
 */
export function useRows<T extends Pick<AnySQLiteSelect, '_' | 'then'>>(
  query: T,
  deps?: unknown[],
): Awaited<T> | null {
  const { data, updatedAt } = useLiveQuery(query, deps);
  return updatedAt === undefined ? null : data;
}
