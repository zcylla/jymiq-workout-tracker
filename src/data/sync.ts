import { eq } from 'drizzle-orm';
import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import type { ExportTables } from '@/lib/export';
import {
  chunk,
  conflictTarget,
  fromRemote,
  type PushGroup,
  planPush,
  SYNC_TABLES,
  toRemote,
} from '@/lib/sync';

import { db } from './db';
import { restoreBackup } from './queries/import';
import { exerciseMuscles, exercises, syncQueue } from './schema';
import {
  SYNC_REGISTRY,
  clearQueue,
  enqueueEverything,
  readQueue,
  queueSize,
  rowsForKeys,
} from './sync-tables';
import { supabase } from './supabase';

interface SyncState {
  initialQueued: boolean;
  lastPushAt: number | null;
  lastError: string | null;
}

const KEY = 'sync-state';
const UPSERT_CHUNK = 200;
const DELETE_CHUNK = 40;
const MAX_ROUNDS = 20;
const PAGE = 1000;
const DEBOUNCE_MS = 3000;

function read(): SyncState {
  const fresh: SyncState = { initialQueued: false, lastPushAt: null, lastError: null };
  try {
    const raw = Storage.getItemSync(KEY);
    if (raw === null) return fresh;
    const v = JSON.parse(raw) as Partial<SyncState>;
    return {
      initialQueued: v.initialQueued === true,
      lastPushAt: typeof v.lastPushAt === 'number' ? v.lastPushAt : null,
      lastError: typeof v.lastError === 'string' ? v.lastError : null,
    };
  } catch {
    return fresh;
  }
}

let state = read();
const listeners = new Set<() => void>();

export const getSyncState = (): SyncState => state;

function setState(patch: Partial<SyncState>): void {
  state = { ...state, ...patch };
  try {
    Storage.setItemSync(KEY, JSON.stringify(state));
  } catch {}
  for (const l of listeners) l();
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(subscribe, getSyncState);
}

export type PushResult = {
  status: 'signed-out' | 'busy' | 'ok' | 'error';
  sent: number;
  message?: string;
};

class PushError extends Error {}

function sqlName(table: (typeof SYNC_TABLES)[number], prop: string): string {
  const col = SYNC_REGISTRY[table].cols.find((c) => c.key === prop);
  if (!col) throw new Error(`no column ${prop} on ${table}`);
  return col.name;
}

let running = false;

export async function pushNow(): Promise<PushResult> {
  if (running) return { status: 'busy', sent: 0 };
  if (!supabase) return { status: 'signed-out', sent: 0 };
  running = true;
  const client = supabase;
  try {
    const { data } = await client.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return { status: 'signed-out', sent: 0 };

    if (!state.initialQueued) {
      enqueueEverything();
      setState({ initialQueued: true });
    }

    let sent = 0;

    const upsertGroup = async (g: PushGroup) => {
      const { cols, keyCols } = SYNC_REGISTRY[g.table];
      const rows = rowsForKeys(g.table, g.keys);
      const onConflict = conflictTarget(keyCols.map((k) => sqlName(g.table, k)));
      const ordered =
        g.table === 'programs'
          ? [rows.filter((r) => r.status !== 'active'), rows.filter((r) => r.status === 'active')]
          : [rows];
      for (const group of ordered)
        for (const part of chunk(group, UPSERT_CHUNK)) {
          const { error } = await client.from(g.table).upsert(
            part.map((r) => toRemote(r, cols, userId)),
            { onConflict },
          );
          if (error) throw new PushError(error.message);
          sent += part.length;
        }
      clearQueue(g.entryIds);
    };

    const deleteGroup = async (g: PushGroup) => {
      const { keyCols } = SYNC_REGISTRY[g.table];
      const names = keyCols.map((k) => sqlName(g.table, k));
      if (names.length === 1) {
        for (const part of chunk(g.keys, DELETE_CHUNK)) {
          const { error } = await client
            .from(g.table)
            .delete()
            .eq('user_id', userId)
            .in(
              names[0],
              part.map((k) => k[0]),
            );
          if (error) throw new PushError(error.message);
        }
      } else {
        for (const key of g.keys) {
          let q = client.from(g.table).delete().eq('user_id', userId);
          names.forEach((n, i) => {
            q = q.eq(n, key[i]);
          });
          const { error } = await q;
          if (error) throw new PushError(error.message);
        }
      }
      sent += g.keys.length;
      clearQueue(g.entryIds);
    };

    const maxRounds = MAX_ROUNDS + Math.ceil(queueSize() / 500);
    for (let round = 0; round < maxRounds; round++) {
      const entries = readQueue(500);
      if (entries.length === 0) break;
      const seen = new Set(entries.map((e) => e.id));
      const plan = planPush([
        ...entries,
        ...readQueue(undefined, 'programs').filter((e) => !seen.has(e.id)),
      ]);
      for (const g of plan.beforeUpserts) await deleteGroup(g);
      for (const g of plan.upserts) await upsertGroup(g);
      for (const g of plan.deletes) await deleteGroup(g);
    }

    if (queueSize() > 0)
      throw new PushError('Changes are still pending. Tap Back up now again to finish.');
    setState({ lastPushAt: Date.now(), lastError: null });
    return { status: 'ok', sent };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error.';
    try {
      setState({ lastError: message });
    } catch {}
    return { status: 'error', sent: 0, message };
  } finally {
    running = false;
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** Trailing 3 s debounce; a harmless no-op when signed out or unconfigured. */
export function syncSoon(): void {
  if (!supabase) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void pushNow();
  }, DEBOUNCE_MS);
}

export async function pullAll(): Promise<ExportTables> {
  if (!supabase) throw new Error('Sync is not configured on this build.');
  const client = supabase;
  const { data } = await client.auth.getSession();
  if (!data.session) throw new Error('Sign in to restore from the cloud.');

  const tables: Record<string, unknown[]> = {};
  for (const name of SYNC_TABLES) {
    const { cols } = SYNC_REGISTRY[name];
    const out: unknown[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data: page, error } = await client
        .from(name)
        .select('*')
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      for (const row of page ?? []) {
        if (row.deleted_at != null) continue;
        out.push(fromRemote(row, cols));
      }
      if (!page || page.length < PAGE) break;
    }
    tables[name] = out;
  }

  const builtIn = db.select().from(exercises).where(eq(exercises.isCustom, false)).all();
  const builtInIds = new Set(builtIn.map((e) => e.id));
  tables.exercises = [...builtIn, ...tables.exercises];
  tables.exercise_muscles = [
    ...db
      .select()
      .from(exerciseMuscles)
      .all()
      .filter((m) => builtInIds.has(m.exerciseId)),
    ...tables.exercise_muscles,
  ];
  return tables;
}

export async function restoreFromCloud(
  writeRollback: () => Promise<{ name: string } | null>,
): Promise<{ written: number; rollbackName: string } | { cancelled: string }> {
  let tables: ExportTables;
  try {
    tables = await pullAll();
  } catch (e) {
    return { cancelled: e instanceof Error ? e.message : 'Could not read the cloud copy.' };
  }
  const rollback = await writeRollback();
  if (!rollback) return { cancelled: 'no rollback file, so nothing was written' };
  const written = restoreBackup(tables);
  db.delete(syncQueue).run();
  setState({ initialQueued: true });
  return { written, rollbackName: rollback.name };
}
