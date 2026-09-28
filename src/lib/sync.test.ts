import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  type Col,
  chunk,
  conflictTarget,
  describeSync,
  fromRemote,
  parseQueueKey,
  planPush,
  type QueueEntry,
  toRemote,
} from './sync.ts';

const e = (
  id: number,
  table: QueueEntry['table'],
  key: (string | number)[],
  op: QueueEntry['op'],
) => ({
  id,
  table,
  key,
  op,
});

test('upserts run parents first, deletes children first, empty tables are omitted', () => {
  const plan = planPush([
    e(1, 'sets', ['s1'], 'upsert'),
    e(2, 'exercises', ['x'], 'upsert'),
    e(3, 'sets', ['s2'], 'upsert'),
    e(4, 'routines', ['r'], 'delete'),
    e(5, 'program_days', ['p', 2], 'delete'),
    e(6, 'sets', ['s3'], 'delete'),
  ]);
  assert.deepEqual(
    plan.upserts.map((g) => g.table),
    ['exercises', 'sets'],
  );
  assert.deepEqual(
    plan.deletes.map((g) => g.table),
    ['sets', 'program_days', 'routines'],
  );
  assert.deepEqual(plan.upserts[1], { table: 'sets', keys: [['s1'], ['s2']], entryIds: [1, 3] });
  assert.deepEqual(plan.deletes[1], { table: 'program_days', keys: [['p', 2]], entryIds: [5] });
  assert.deepEqual(planPush([]), { upserts: [], deletes: [] });
});

const COLS: Col[] = [
  { key: 'id', name: 'id' },
  { key: 'sessionExerciseId', name: 'session_exercise_id' },
  { key: 'isWarmup', name: 'is_warmup' },
  { key: 'note', name: 'note' },
  { key: 'tags', name: 'tags' },
];

test('toRemote renames, adds user_id and nulls undefined; fromRemote inverts it', () => {
  const row = { id: 'a', sessionExerciseId: 'se', isWarmup: false, note: undefined, tags: [1, 2] };
  const remote = toRemote(row, COLS, 'u1');
  assert.deepEqual(remote, {
    user_id: 'u1',
    id: 'a',
    session_exercise_id: 'se',
    is_warmup: false,
    note: null,
    tags: [1, 2],
  });
  assert.deepEqual(fromRemote(remote, COLS), { ...row, note: null });
});

test('fromRemote drops user_id and deleted_at and keeps nulls', () => {
  const back = fromRemote(
    {
      id: 'a',
      session_exercise_id: 'se',
      is_warmup: true,
      note: null,
      tags: null,
      user_id: 'u',
      deleted_at: 5,
    },
    COLS,
  );
  assert.deepEqual(back, {
    id: 'a',
    sessionExerciseId: 'se',
    isWarmup: true,
    note: null,
    tags: null,
  });
});

test('chunk splits evenly, keeps the remainder and handles empty', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([], 3), []);
});

test('parseQueueKey accepts string/number arrays and rejects everything else', () => {
  assert.deepEqual(parseQueueKey('["a"]'), ['a']);
  assert.deepEqual(parseQueueKey('["p",2]'), ['p', 2]);
  assert.throws(() => parseQueueKey('"a"'));
  assert.throws(() => parseQueueKey('{}'));
  assert.throws(() => parseQueueKey('[{}]'));
  assert.throws(() => parseQueueKey('not json'));
});

test('conflictTarget puts user_id first', () => {
  assert.equal(conflictTarget(['id']), 'user_id,id');
  assert.equal(conflictTarget(['program_id', 'weekday']), 'user_id,program_id,weekday');
});

test('describeSync', () => {
  const now = new Date(2026, 8, 20, 12, 0).getTime();
  const at = (ms: number) => now - ms;
  const d = (lastPushAt: number | null, pending = 0, error: string | null = null) =>
    describeSync({ lastPushAt, pending, error }, now);
  assert.equal(d(at(5), 0, 'offline'), 'Last backup failed — offline');
  assert.equal(d(null), 'Not backed up yet.');
  assert.equal(d(at(30_000)), 'Backed up just now');
  assert.equal(d(at(5 * 60_000)), 'Backed up 5 min ago');
  assert.equal(d(at(3 * 3_600_000)), 'Backed up 3 h ago');
  assert.equal(d(new Date(2026, 8, 3, 9).getTime()), 'Backed up 3 Sep');
  assert.equal(d(at(5 * 60_000), 1), 'Backed up 5 min ago · 1 change waiting');
  assert.equal(d(at(5 * 60_000), 4), 'Backed up 5 min ago · 4 changes waiting');
  assert.equal(d(null, 2), 'Not backed up yet · 2 changes waiting');
});
