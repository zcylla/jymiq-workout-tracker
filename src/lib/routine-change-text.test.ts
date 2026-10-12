import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeChange } from './routine-change-text.ts';
import type { RoutineChange } from './routine-diff.ts';

const names = { bench: 'Bench Press', ohp: 'Overhead Press' };

test('add names the lift and its targets, dropping what is null', () => {
  const add = (over: Partial<Extract<RoutineChange, { kind: 'add' }>> = {}): RoutineChange => ({
    kind: 'add',
    key: 'add:1',
    exerciseId: 'bench',
    targetSets: 3,
    targetReps: 10,
    targetWeightKg: 60,
    ...over,
  });
  assert.deepEqual(describeChange(add(), names, 'kg'), {
    tag: 'ADD',
    title: 'Bench Press',
    detail: '3 × 10 @ 60 KG',
  });
  assert.equal(describeChange(add({ targetWeightKg: null }), names, 'kg').detail, '3 × 10');
  assert.equal(describeChange(add({ targetReps: null }), names, 'kg').detail, '3 SETS @ 60 KG');
  assert.equal(
    describeChange(add({ targetReps: null, targetWeightKg: null, targetSets: 1 }), names, 'kg')
      .detail,
    '1 SET',
  );
});

test('remove says the lift was not done', () => {
  assert.deepEqual(
    describeChange(
      { kind: 'remove', key: 'remove:1', routineExerciseId: 'r1', exerciseId: 'ohp' },
      names,
      'kg',
    ),
    { tag: 'REMOVE', title: 'Overhead Press', detail: 'NOT DONE THIS SESSION' },
  );
});

test('swap reads old to new with the replacement targets', () => {
  assert.deepEqual(
    describeChange(
      {
        kind: 'swap',
        key: 'swap:1',
        routineExerciseId: 'r1',
        fromExerciseId: 'bench',
        toExerciseId: 'ohp',
        targetSets: 3,
        targetReps: 8,
        targetWeightKg: 40,
      },
      names,
      'kg',
    ),
    { tag: 'SWAP', title: 'Bench Press → Overhead Press', detail: '3 × 8 @ 40 KG' },
  );
});

test('sets, reps and load show before and after', () => {
  assert.deepEqual(
    describeChange(
      { kind: 'sets', key: 's', routineExerciseId: 'r1', exerciseId: 'bench', from: 3, to: 4 },
      names,
      'kg',
    ),
    { tag: 'SETS', title: 'Bench Press', detail: '3 → 4 SETS' },
  );
  assert.equal(
    describeChange(
      { kind: 'sets', key: 's', routineExerciseId: 'r1', exerciseId: 'bench', from: 3, to: 1 },
      names,
      'kg',
    ).detail,
    '3 → 1 SET',
  );
  assert.deepEqual(
    describeChange(
      { kind: 'reps', key: 'r', routineExerciseId: 'r1', exerciseId: 'bench', from: 8, to: 10 },
      names,
      'kg',
    ),
    { tag: 'REPS', title: 'Bench Press', detail: '8 → 10 REPS' },
  );
  assert.deepEqual(
    describeChange(
      {
        kind: 'load',
        key: 'l',
        routineExerciseId: 'r1',
        exerciseId: 'bench',
        fromKg: 60,
        toKg: 62.5,
      },
      names,
      'kg',
    ),
    { tag: 'LOAD', title: 'Bench Press', detail: '60 → 62.5 KG' },
  );
});

test('pounds convert with the app one-decimal format and an LB label', () => {
  assert.equal(
    describeChange(
      {
        kind: 'load',
        key: 'l',
        routineExerciseId: 'r1',
        exerciseId: 'bench',
        fromKg: 60,
        toKg: 62.5,
      },
      names,
      'lb',
    ).detail,
    '132.3 → 137.8 LB',
  );
  assert.equal(
    describeChange(
      {
        kind: 'add',
        key: 'a',
        exerciseId: 'bench',
        targetSets: 3,
        targetReps: 10,
        targetWeightKg: 100,
      },
      names,
      'lb',
    ).detail,
    '3 × 10 @ 220.5 LB',
  );
});

test('an exercise the names map does not know falls back to Exercise', () => {
  assert.equal(
    describeChange(
      { kind: 'remove', key: 'remove:1', routineExerciseId: 'r1', exerciseId: 'gone' },
      names,
      'kg',
    ).title,
    'Exercise',
  );
  assert.equal(
    describeChange(
      {
        kind: 'swap',
        key: 'swap:1',
        routineExerciseId: 'r1',
        fromExerciseId: 'gone',
        toExerciseId: 'ohp',
        targetSets: 3,
        targetReps: null,
        targetWeightKg: null,
      },
      names,
      'kg',
    ).title,
    'Exercise → Overhead Press',
  );
});
