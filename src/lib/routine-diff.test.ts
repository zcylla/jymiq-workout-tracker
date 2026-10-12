import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  hasRoutinePlan,
  type PlanLine,
  type RoutineChange,
  routineChanges,
  type SessionExerciseInput,
} from './routine-diff.ts';
import type { SetKind, SetLike } from './volume.ts';

const line = (
  id: string,
  exerciseId: string,
  position: number,
  targetSets = 3,
  targetReps: number | null = 10,
  targetWeightKg: number | null = 100,
): PlanLine => ({ id, exerciseId, position, targetSets, targetReps, targetWeightKg });

const done = (
  weightKg: number | null,
  reps: number | null,
  kind: SetKind = 'working',
): SetLike => ({
  weightKg,
  reps,
  kind,
  completedAt: 1,
});
const pending = (weightKg = 100, reps = 10): SetLike => ({
  weightKg,
  reps,
  kind: 'working',
  completedAt: null,
});
const asPlanned = (n = 3) => Array.from({ length: n }, () => done(100, 10));

const planned = (
  id: string,
  routineExerciseId: string,
  exerciseId: string,
  position: number,
  sets: SetLike[],
  extra: Partial<SessionExerciseInput> = {},
): SessionExerciseInput => ({
  id,
  exerciseId,
  routineExerciseId,
  addedMidSession: false,
  removedAt: null,
  position,
  plannedSets: 3,
  sets,
  ...extra,
});

const added = (
  id: string,
  exerciseId: string,
  position: number,
  sets: SetLike[],
  extra: Partial<SessionExerciseInput> = {},
): SessionExerciseInput => ({
  id,
  exerciseId,
  routineExerciseId: null,
  addedMidSession: true,
  removedAt: null,
  position,
  plannedSets: null,
  sets,
  ...extra,
});

const keys = (changes: RoutineChange[]) => changes.map((c) => c.key);

function apply(lines: PlanLine[], exercises: SessionExerciseInput[], c: RoutineChange) {
  const at = (id: string) => lines.findIndex((l) => l.id === id);
  switch (c.kind) {
    case 'add':
      lines.push({
        id: `new-${c.key}`,
        exerciseId: c.exerciseId,
        position: Math.max(...lines.map((l) => l.position)) + 1,
        targetSets: c.targetSets,
        targetReps: c.targetReps,
        targetWeightKg: c.targetWeightKg,
      });
      return;
    case 'remove':
      lines.splice(at(c.routineExerciseId), 1);
      for (const e of exercises)
        if (e.routineExerciseId === c.routineExerciseId) e.routineExerciseId = null;
      return;
    case 'swap': {
      const l = lines[at(c.routineExerciseId)];
      Object.assign(l, {
        exerciseId: c.toExerciseId,
        targetSets: c.targetSets,
        targetReps: c.targetReps,
        targetWeightKg: c.targetWeightKg,
      });
      return;
    }
    case 'sets':
      lines[at(c.routineExerciseId)].targetSets = c.to;
      return;
    case 'reps':
      lines[at(c.routineExerciseId)].targetReps = c.to;
      return;
    case 'load':
      lines[at(c.routineExerciseId)].targetWeightKg = c.toKg;
  }
}

test('a session done exactly as planned reports nothing', () => {
  const lines = [line('L1', 'bench', 0), line('L2', 'row', 1)];
  const ex = [
    planned('a', 'L1', 'bench', 0, asPlanned()),
    planned('b', 'L2', 'row', 1, asPlanned()),
  ];
  assert.deepEqual(routineChanges(lines, ex), []);
});

test('an added lift with logged work is offered with its top-set targets', () => {
  const lines = [line('L1', 'bench', 0)];
  const ex = [
    planned('a', 'L1', 'bench', 0, asPlanned()),
    added('b', 'curl', 1, [
      done(20, 12, 'warmup'),
      done(30, 10),
      done(35, 8),
      done(35, 6),
      pending(),
    ]),
  ];
  assert.deepEqual(routineChanges(lines, ex), [
    {
      kind: 'add',
      key: 'add:b',
      exerciseId: 'curl',
      targetSets: 3,
      targetReps: 8,
      targetWeightKg: 35,
    },
  ]);
});

test('an added lift with nothing logged, or removed again, is not offered', () => {
  const lines = [line('L1', 'bench', 0)];
  const ex = [
    planned('a', 'L1', 'bench', 0, asPlanned()),
    added('b', 'curl', 1, [pending()]),
    added('c', 'dip', 2, [done(null, 10)], { removedAt: 5 }),
  ];
  assert.deepEqual(routineChanges(lines, ex), []);
});

test('an added bodyweight lift takes its best reps and no load', () => {
  const ex = [added('b', 'dip', 0, [done(null, 12), done(null, 9)])];
  assert.deepEqual(routineChanges([], ex), [
    {
      kind: 'add',
      key: 'add:b',
      exerciseId: 'dip',
      targetSets: 2,
      targetReps: 12,
      targetWeightKg: null,
    },
  ]);
});

test('an added lift already on an unlinked routine line counts as saved', () => {
  const ex = [planned('a', 'L1', 'bench', 0, asPlanned()), added('b', 'curl', 1, [done(30, 10)])];
  assert.deepEqual(routineChanges([line('L1', 'bench', 0), line('L9', 'curl', 1)], ex), []);
  const linkedCurl = [
    planned('a', 'L1', 'curl', 0, asPlanned()),
    added('b', 'curl', 1, [done(30, 10)]),
  ];
  assert.deepEqual(keys(routineChanges([line('L1', 'curl', 0)], linkedCurl)), ['add:b']);
});

test('two additions of one lift each need their own saved line', () => {
  const ex = [added('b', 'curl', 0, [done(30, 10)]), added('c', 'curl', 1, [done(30, 10)])];
  assert.deepEqual(keys(routineChanges([line('L9', 'curl', 0)], ex)), ['add:c']);
});

test('a planned lift removed with nothing logged is offered as a removal', () => {
  const lines = [line('L1', 'bench', 0), line('L2', 'row', 1)];
  const ex = [
    planned('a', 'L1', 'bench', 0, asPlanned()),
    planned('b', 'L2', 'row', 1, [pending(), pending(), pending()], { removedAt: 5 }),
  ];
  assert.deepEqual(routineChanges(lines, ex), [
    { kind: 'remove', key: 'remove:L2', routineExerciseId: 'L2', exerciseId: 'row' },
  ]);
});

test('a planned lift skipped after logging a set is not a removal', () => {
  const lines = [line('L1', 'bench', 0)];
  const ex = [
    planned('a', 'L1', 'bench', 0, [done(20, 10, 'warmup'), pending()], { removedAt: 5 }),
  ];
  assert.deepEqual(routineChanges(lines, ex), []);
});

test('a planned lift left untouched but not removed reports nothing', () => {
  const ex = [planned('a', 'L1', 'bench', 0, [pending(), pending(), pending()])];
  assert.deepEqual(routineChanges([line('L1', 'bench', 0)], ex), []);
});

test('a replaced lift is a swap carrying the newcomer targets, not a removal and an addition', () => {
  const lines = [line('L1', 'bench', 0), line('L2', 'row', 1)];
  const ex = [
    planned('a', 'L1', 'bench', 0, [pending()], { removedAt: 5 }),
    added('n', 'db-bench', 1, [done(40, 10), done(40, 10), done(40, 10)], { plannedSets: 3 }),
    planned('b', 'L2', 'row', 2, asPlanned()),
  ];
  assert.deepEqual(routineChanges(lines, ex), [
    {
      kind: 'swap',
      key: 'swap:L1',
      routineExerciseId: 'L1',
      fromExerciseId: 'bench',
      toExerciseId: 'db-bench',
      targetSets: 3,
      targetReps: 10,
      targetWeightKg: 40,
    },
  ]);
});

test('a swap already saved to the routine reports nothing', () => {
  const ex = [
    planned('a', 'L1', 'bench', 0, [pending()], { removedAt: 5 }),
    added('n', 'db-bench', 1, [done(40, 10)], { plannedSets: 3 }),
  ];
  assert.deepEqual(routineChanges([line('L1', 'db-bench', 0)], ex), []);
});

test('a swap whose newcomer was never lifted reports nothing', () => {
  const ex = [
    planned('a', 'L1', 'bench', 0, [pending()], { removedAt: 5 }),
    added('n', 'db-bench', 1, [pending()], { plannedSets: 3 }),
  ];
  assert.deepEqual(routineChanges([line('L1', 'bench', 0)], ex), []);
});

test('swapping twice pairs the routine line with the lift actually done', () => {
  const ex = [
    planned('a', 'L1', 'bench', 0, [pending()], { removedAt: 5 }),
    added('n1', 'db-bench', 1, [pending()], { plannedSets: 3, removedAt: 6 }),
    added('n2', 'machine-press', 2, [done(50, 10)], { plannedSets: 3 }),
  ];
  const [swap] = routineChanges([line('L1', 'bench', 0)], ex);
  assert.equal(swap?.kind === 'swap' && swap.toExerciseId, 'machine-press');
});

test('logging more or fewer working sets than planned changes the set count', () => {
  const lines = [line('L1', 'bench', 0), line('L2', 'row', 1)];
  const ex = [
    planned('a', 'L1', 'bench', 0, asPlanned(4)),
    planned('b', 'L2', 'row', 1, [done(100, 10), done(100, 10), pending()]),
  ];
  assert.deepEqual(routineChanges(lines, ex), [
    { kind: 'sets', key: 'sets:L1', routineExerciseId: 'L1', exerciseId: 'bench', from: 3, to: 4 },
    { kind: 'sets', key: 'sets:L2', routineExerciseId: 'L2', exerciseId: 'row', from: 3, to: 2 },
  ]);
});

test('every working set at one new rep count changes the target reps', () => {
  const ex = [planned('a', 'L1', 'bench', 0, [done(100, 8), done(100, 8), done(100, 8)])];
  assert.deepEqual(routineChanges([line('L1', 'bench', 0)], ex), [
    { kind: 'reps', key: 'reps:L1', routineExerciseId: 'L1', exerciseId: 'bench', from: 10, to: 8 },
  ]);
  assert.deepEqual(keys(routineChanges([line('L1', 'bench', 0, 3, null)], ex)), ['reps:L1']);
});

test('every working set at one new load changes the target load', () => {
  const ex = [planned('a', 'L1', 'bench', 0, [done(102.5, 10), done(102.5, 10), done(102.5, 10)])];
  assert.deepEqual(routineChanges([line('L1', 'bench', 0)], ex), [
    {
      kind: 'load',
      key: 'load:L1',
      routineExerciseId: 'L1',
      exerciseId: 'bench',
      fromKg: 100,
      toKg: 102.5,
    },
  ]);
  assert.deepEqual(keys(routineChanges([line('L1', 'bench', 0, 3, 10, null)], ex)), ['load:L1']);
});

test('load differences inside a hundredth of a kilogram are rounding, not a change', () => {
  const ex = [planned('a', 'L1', 'bench', 0, [done(100.004, 10), done(99.996, 10), done(100, 10)])];
  assert.deepEqual(routineChanges([line('L1', 'bench', 0)], ex), []);
});

test('working sets that disagree report no reps or load change', () => {
  const ex = [planned('a', 'L1', 'bench', 0, [done(100, 10), done(105, 8), done(110, 6)])];
  assert.deepEqual(routineChanges([line('L1', 'bench', 0)], ex), []);
});

test('bodyweight sets never report a load change', () => {
  const ex = [planned('a', 'L1', 'dip', 0, [done(null, 10), done(null, 10), done(null, 10)])];
  assert.deepEqual(routineChanges([line('L1', 'dip', 0, 3, 10, null)], ex), []);
});

test('warm-ups and drops never count; a failure set is a working set', () => {
  const ex = [
    planned('a', 'L1', 'bench', 0, [
      done(60, 5, 'warmup'),
      done(100, 10),
      done(100, 10),
      done(100, 10, 'failure'),
      done(70, 12, 'drop'),
    ]),
  ];
  assert.deepEqual(routineChanges([line('L1', 'bench', 0)], ex), []);
});

test('only a session with routine-linked rows has a plan', () => {
  const linked = [planned('a', 'L1', 'bench', 0, [])];
  const copied = [added('a', 'bench', 0, [], { addedMidSession: false })];
  assert.equal(hasRoutinePlan('r1', linked), true);
  assert.equal(hasRoutinePlan('r1', copied), false);
  assert.equal(hasRoutinePlan(null, linked), false);
});

test('a routine line linked twice, or no longer in the routine, is ignored', () => {
  const ex = [
    planned('a', 'L1', 'bench', 0, asPlanned(5)),
    planned('b', 'L1', 'bench', 1, [pending()], { removedAt: 5 }),
    planned('c', 'gone', 'row', 2, asPlanned(5)),
  ];
  assert.deepEqual(routineChanges([line('L1', 'bench', 0)], ex), []);
});

test('changes follow the routine order, sets before reps before load, additions last', () => {
  const lines = [line('L2', 'row', 1), line('L3', 'squat', 2), line('L1', 'bench', 0)];
  const ex = [
    planned('a', 'L1', 'bench', 0, [done(105, 8), done(105, 8), done(105, 8), done(105, 8)]),
    added('x', 'curl', 1, [done(30, 10)]),
    planned('b', 'L2', 'row', 2, [pending()], { removedAt: 5 }),
    planned('c', 'L3', 'squat', 3, [pending()], { removedAt: 5 }),
    added('n', 'leg-press', 4, [done(150, 10)], { plannedSets: 3 }),
    added('y', 'dip', 5, [done(null, 10)]),
  ];
  assert.deepEqual(keys(routineChanges(lines, ex)), [
    'sets:L1',
    'reps:L1',
    'load:L1',
    'remove:L2',
    'swap:L3',
    'add:x',
    'add:y',
  ]);
});

test('saving any change makes it stop being reported', () => {
  const build = () => ({
    lines: [line('L1', 'bench', 0), line('L2', 'row', 1), line('L3', 'squat', 2)],
    ex: [
      planned('a', 'L1', 'bench', 0, [done(105, 8), done(105, 8), done(105, 8), done(105, 8)]),
      planned('b', 'L2', 'row', 1, [pending()], { removedAt: 5 }),
      planned('c', 'L3', 'squat', 2, [pending()], { removedAt: 5 }),
      added('n', 'leg-press', 3, [done(150, 10)], { plannedSets: 3 }),
      added('x', 'curl', 4, [done(30, 10)]),
    ],
  });
  const all = routineChanges(build().lines, build().ex);
  assert.equal(all.length, 6);
  for (const change of all) {
    const { lines, ex } = build();
    apply(lines, ex, change);
    assert.deepEqual(
      keys(routineChanges(lines, ex)),
      keys(all).filter((k) => k !== change.key),
      change.key,
    );
  }
  const { lines, ex } = build();
  for (const change of all) apply(lines, ex, change);
  assert.deepEqual(routineChanges(lines, ex), []);
});
