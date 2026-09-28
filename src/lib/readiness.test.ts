import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type Answers, readinessCall, recentMuscles, type RecentSetRow } from './readiness.ts';

const now = new Date(2026, 8, 28, 9, 0).getTime();
const day = (back: number, hour = 18) => new Date(2026, 8, 28 - back, hour).getTime();

const fine: Answers = { sleep: 'ok', soreness: 'some', energy: 'good' };
const call = (answers: Answers, routineName: string | null = null, recent = [] as never[]) =>
  readinessCall({ answers, routineName, recent, now });

test('the lead follows the number of bad answers', () => {
  assert.equal(call(fine).lead, 'Train as planned.');
  assert.equal(
    call({ ...fine, sleep: 'poor' }).lead,
    'Train as planned, and ease off if the warm-ups feel slow.',
  );
  assert.equal(call({ sleep: 'poor', soreness: 'some', energy: 'low' }).lead, 'Go lighter today.');
  assert.equal(
    call({ sleep: 'poor', soreness: 'a_lot', energy: 'low' }).lead,
    'Consider resting today.',
  );
});

test('bad answers are named', () => {
  assert.equal(
    call({ sleep: 'poor', soreness: 'some', energy: 'low' }).reason,
    'You said sleep was poor and energy is low.',
  );
  assert.equal(call({ ...fine, soreness: 'a_lot' }).reason, 'You said soreness is high.');
  assert.equal(
    call({ sleep: 'poor', soreness: 'a_lot', energy: 'low' }).reason,
    'You said sleep was poor, soreness is high and energy is low.',
  );
});

test('no bad answers and no routine says nothing points the other way', () => {
  assert.equal(call(fine).reason, 'Nothing you said points the other way.');
});

test('muscles trained the same day are grouped', () => {
  const recent = [
    { muscle: 'glutes', sets: 6, lastAt: day(1) },
    { muscle: 'quads', sets: 9, lastAt: day(1) },
  ] as never[];
  assert.equal(
    call(fine, 'Lower B', recent).reason,
    'Quads and glutes were trained yesterday — 9 and 6 working sets.',
  );
});

test('muscles trained on different days are split', () => {
  const recent = [
    { muscle: 'glutes', sets: 6, lastAt: day(2) },
    { muscle: 'quads', sets: 9, lastAt: day(1) },
  ] as never[];
  assert.equal(
    call(fine, 'Lower B', recent).reason,
    'Quads were trained yesterday (9 working sets) and glutes 2 days ago (6).',
  );
});

test('more than three muscles are trimmed', () => {
  const recent = ['a', 'b', 'c', 'd', 'e'].map((muscle, i) => ({
    muscle,
    sets: 9 - i,
    lastAt: day(0, 7),
  })) as never[];
  assert.equal(
    call(fine, 'Lower B', recent).reason,
    'A, b, c and 2 more were trained today — 9, 8 and 7 working sets.',
  );
});

test('an empty recent list is stated', () => {
  assert.equal(
    call({ ...fine, energy: 'low' }, 'Lower B').reason,
    'You said energy is low. Nothing Lower B works was trained in the last two days.',
  );
});

const row = (over: Partial<RecentSetRow>): RecentSetRow => ({
  muscle: 'quads',
  kind: 'working',
  weightKg: 100,
  reps: 5,
  completedAt: day(1),
  startedAt: day(1),
  ...over,
});

test('recentMuscles keeps prime muscles, counts working sets, sorts', () => {
  const rows = [
    row({}),
    row({ startedAt: day(0, 7) }),
    row({ kind: 'warmup' }),
    row({ completedAt: null }),
    row({ muscle: 'glutes' }),
    row({ muscle: 'glutes', startedAt: day(2, 9) }),
    row({ muscle: 'glutes', kind: 'warmup' }),
    row({ muscle: 'chest' }),
    row({ muscle: 'calves', kind: 'warmup' }),
    row({ muscle: 'calves', completedAt: null }),
  ];
  assert.deepEqual(recentMuscles(rows, ['quads', 'glutes', 'calves'], now), [
    { muscle: 'quads', sets: 2, lastAt: day(0, 7) },
    { muscle: 'glutes', sets: 2, lastAt: day(1) },
  ]);
});
