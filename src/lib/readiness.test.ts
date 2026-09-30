import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type Answers, readinessStep, recentMuscles, type RecentSetRow } from './readiness.ts';

const now = new Date(2026, 8, 28, 9, 0).getTime();
const day = (back: number, hour = 18) => new Date(2026, 8, 28 - back, hour).getTime();

const fine: Answers = { sleep: 'ok', soreness: 'some', energy: 'good' };

test('the step follows the number of bad answers', () => {
  assert.equal(readinessStep(fine), 'GO');
  assert.equal(readinessStep({ ...fine, sleep: 'poor' }), 'EASY');
  assert.equal(readinessStep({ ...fine, soreness: 'a_lot' }), 'EASY');
  assert.equal(readinessStep({ ...fine, energy: 'low' }), 'EASY');
  assert.equal(readinessStep({ sleep: 'poor', soreness: 'some', energy: 'low' }), 'LIGHT');
  assert.equal(readinessStep({ sleep: 'poor', soreness: 'a_lot', energy: 'low' }), 'REST');
});

test('the best answers are GO and a middling answer is not bad', () => {
  assert.equal(readinessStep({ sleep: 'good', soreness: 'none', energy: 'good' }), 'GO');
  assert.equal(readinessStep({ sleep: 'ok', soreness: 'some', energy: 'ok' }), 'GO');
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
