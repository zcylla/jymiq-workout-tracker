export const SYNC_TABLES = [
  'exercises',
  'exercise_muscles',
  'routines',
  'routine_exercises',
  'programs',
  'program_days',
  'sessions',
  'session_exercises',
  'sets',
  'personal_records',
  'body_weights',
  'check_ins',
] as const;

export type SyncTable = (typeof SYNC_TABLES)[number];
export type RowKey = (string | number)[];

export interface QueueEntry {
  id: number;
  table: SyncTable;
  key: RowKey;
  op: 'upsert' | 'delete';
}

export interface PushGroup {
  table: SyncTable;
  keys: RowKey[];
  entryIds: number[];
}

export interface PushPlan {
  upserts: PushGroup[];
  deletes: PushGroup[];
}

function group(entries: readonly QueueEntry[], tables: readonly SyncTable[]): PushGroup[] {
  const out: PushGroup[] = [];
  for (const table of tables) {
    const mine = entries.filter((e) => e.table === table);
    if (mine.length) {
      out.push({ table, keys: mine.map((e) => e.key), entryIds: mine.map((e) => e.id) });
    }
  }
  return out;
}

/** Upserts run parents-first, deletes children-first, so no foreign key is ever dangling remotely. */
export function planPush(entries: readonly QueueEntry[]): PushPlan {
  return {
    upserts: group(
      entries.filter((e) => e.op === 'upsert'),
      SYNC_TABLES,
    ),
    deletes: group(
      entries.filter((e) => e.op === 'delete'),
      [...SYNC_TABLES].reverse(),
    ),
  };
}

/** A drizzle property key and its SQL column name. */
export interface Col {
  key: string;
  name: string;
}

export function toRemote(
  row: Record<string, unknown>,
  cols: readonly Col[],
  userId: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = { user_id: userId };
  for (const { key, name } of cols) out[name] = row[key] ?? null;
  return out;
}

export function fromRemote(
  row: Record<string, unknown>,
  cols: readonly Col[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const { key, name } of cols) out[key] = row[name] ?? null;
  return out;
}

export function chunk<T>(xs: readonly T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/** The queue is read back from disk, so its keys are checked rather than trusted. */
export function parseQueueKey(rowKey: string): RowKey {
  const v: unknown = JSON.parse(rowKey);
  if (!Array.isArray(v) || !v.every((x) => typeof x === 'string' || typeof x === 'number')) {
    throw new Error(`bad sync queue key: ${rowKey}`);
  }
  return v;
}

/** PostgREST onConflict target: user_id then the local key columns' SQL names. */
export function conflictTarget(keyNames: readonly string[]): string {
  return ['user_id', ...keyNames].join(',');
}

export interface SyncStatus {
  lastPushAt: number | null;
  pending: number;
  error: string | null;
}

function when(at: number, now: number): string {
  const min = Math.floor((now - at) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = new Date(at);
  return `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
}

/** One honest line for the Account screen. */
export function describeSync(s: SyncStatus, now: number): string {
  if (s.error) return `Last backup failed — ${s.error}`;
  if (s.lastPushAt === null && s.pending === 0) return 'Not backed up yet.';
  const base = s.lastPushAt === null ? 'Not backed up yet' : `Backed up ${when(s.lastPushAt, now)}`;
  if (s.pending === 0) return base;
  return `${base} · ${s.pending} ${s.pending === 1 ? 'change' : 'changes'} waiting`;
}
