import assert from 'node:assert/strict';
import { test } from 'node:test';

import { performAgainPlan } from './perform-again.ts';

const set = (
  sessionExerciseId: string,
  position: number,
  completedAt: number | null,
  weightKg: number | null = 100,
  reps: number | null = 5,
  kind: 'warmup' | 'working' | 'drop' | 'failure' = 'working',
) => ({ sessionExerciseId, position, kind, weightKg, reps, completedAt });

test('copies the performed sets of each exercise, in performed order', () => {
  const plan = performAgainPlan(
    [
      { id: 'b', exerciseId: 'row', position: 1 },
      { id: 'a', exerciseId: 'squat', position: 0 },
    ],
    [set('b', 1, 5, 60, 10), set('a', 2, 4, 105, 4), set('a', 1, 3, 100, 5, 'warmup')],
  );
  assert.deepEqual(plan, [
    {
      exerciseId: 'squat',
      sets: [
        { kind: 'warmup', weightKg: 100, reps: 5 },
        { kind: 'working', weightKg: 105, reps: 4 },
      ],
    },
    { exerciseId: 'row', sets: [{ kind: 'working', weightKg: 60, reps: 10 }] },
  ]);
});

test('unlogged sets are left behind, and an exercise with none is dropped', () => {
  const plan = performAgainPlan(
    [
      { id: 'a', exerciseId: 'squat', position: 0 },
      { id: 'b', exerciseId: 'row', position: 1 },
    ],
    [set('a', 1, 3), set('a', 2, null), set('b', 1, null), set('b', 2, null)],
  );
  assert.deepEqual(plan, [
    { exerciseId: 'squat', sets: [{ kind: 'working', weightKg: 100, reps: 5 }] },
  ]);
});

test('sets of exercises not passed in are ignored, and nothing performed is an empty plan', () => {
  assert.deepEqual(
    performAgainPlan([{ id: 'a', exerciseId: 'squat', position: 0 }], [set('x', 1, 9)]),
    [],
  );
  assert.deepEqual(performAgainPlan([], []), []);
});

test('a bodyweight set keeps its null weight', () => {
  const plan = performAgainPlan(
    [{ id: 'a', exerciseId: 'pullup', position: 0 }],
    [set('a', 1, 2, null, 8)],
  );
  assert.deepEqual(plan[0]?.sets, [{ kind: 'working', weightKg: null, reps: 8 }]);
});
