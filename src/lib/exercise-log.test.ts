import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatLogSet, groupExerciseLog, type LogRow } from './exercise-log.ts';

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 8, 24, 10);

let n = 0;
function row(over: Partial<LogRow> = {}): LogRow {
  n += 1;
  return {
    id: `s${n}`,
    sessionId: 'a',
    startedAt: T0,
    exercisePosition: 1,
    position: 1,
    kind: 'working',
    weightKg: 60,
    reps: 8,
    rpe: null,
    completedAt: T0 + 1,
    removedAt: null,
    ...over,
  };
}

test('no rows is no entries', () => {
  assert.deepEqual(groupExerciseLog([]), []);
});

test('sets come out in performed order whatever order they arrive in', () => {
  const rows = [
    row({ id: 'c', position: 3 }),
    row({ id: 'a', position: 1 }),
    row({ id: 'd', exercisePosition: 2, position: 1 }),
    row({ id: 'b', position: 2 }),
  ];
  const [entry] = groupExerciseLog(rows);
  assert.deepEqual(
    entry.sets.map((s) => s.id),
    ['a', 'b', 'c', 'd'],
  );
});

test('sessions are newest first, and two on one day stay two events', () => {
  const rows = [
    row({ sessionId: 'morning', startedAt: T0 }),
    row({ sessionId: 'evening', startedAt: T0 + 8 * 3_600_000 }),
    row({ sessionId: 'last-week', startedAt: T0 - 7 * DAY }),
  ];
  assert.deepEqual(
    groupExerciseLog(rows).map((e) => e.sessionId),
    ['evening', 'morning', 'last-week'],
  );
});

test('a set that was pre-filled but never logged is left out', () => {
  const [entry] = groupExerciseLog([row({ id: 'done' }), row({ id: 'plan', completedAt: null })]);
  assert.deepEqual(
    entry.sets.map((s) => s.id),
    ['done'],
  );
});

test('a removed exercise row contributes nothing, and a session left empty disappears', () => {
  const rows = [
    row({ sessionId: 'kept', id: 'k' }),
    row({ sessionId: 'kept', id: 'gone', removedAt: T0 + 5 }),
    row({ sessionId: 'dropped', startedAt: T0 - DAY, removedAt: T0 }),
    row({ sessionId: 'unlogged', startedAt: T0 - 2 * DAY, completedAt: null }),
  ];
  const entries = groupExerciseLog(rows);
  assert.deepEqual(
    entries.map((e) => e.sessionId),
    ['kept'],
  );
  assert.deepEqual(
    entries[0].sets.map((s) => s.id),
    ['k'],
  );
});

test('a session of only warm-ups is still an event', () => {
  const entries = groupExerciseLog([row({ kind: 'warmup' }), row({ kind: 'warmup', position: 2 })]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].sets.length, 2);
});

test('a set line is weight times reps, with RPE when there is one', () => {
  assert.equal(formatLogSet(row({ weightKg: 60, reps: 8 }), 'kg'), '60 × 8');
  assert.equal(formatLogSet(row({ weightKg: 62.5, reps: 4, rpe: 9 }), 'kg'), '62.5 × 4 · RPE 9');
  assert.equal(formatLogSet(row({ weightKg: 100, reps: 5 }), 'lb'), '220.5 × 5');
});

test('a set without a weight or reps shows a dash', () => {
  assert.equal(formatLogSet(row({ weightKg: null, reps: 12 }), 'kg'), '— × 12');
  assert.equal(formatLogSet(row({ weightKg: 40, reps: null }), 'kg'), '40 × —');
});
