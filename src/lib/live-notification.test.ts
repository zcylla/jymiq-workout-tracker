import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  liveNotificationContent,
  liveNotificationState,
  nativeLiveNotificationContent,
  observeNotificationRest,
} from './live-notification.ts';
import { timeLabel } from './time.ts';

const nowMs = new Date(2026, 9, 1, 15, 40, 30).getTime();
const state = {
  routineName: 'Leg Day',
  exerciseName: 'Barbell Squat',
  setNumber: 3,
  setCount: 5,
  weightKg: 100,
  reps: 8,
  unit: 'kg' as const,
  restUntil: null,
  nowMs,
  completedSets: 2,
  totalSets: 5,
  nextSetNumber: 3,
};

test('native rest content replaces the text deadline with a timer descriptor', () => {
  const restUntil = nowMs + 90_000;
  assert.deepEqual(nativeLiveNotificationContent({ ...state, restUntil }, nowMs), {
    title: 'Leg Day',
    lines: ['Barbell Squat', '100 kg × 8 reps'],
    rest: { startMs: nowMs, endMs: restUntil },
  });
});

test('native content without rest has no timer or rest line', () => {
  assert.deepEqual(nativeLiveNotificationContent(state, null), {
    title: 'Leg Day',
    lines: ['Barbell Squat', '100 kg × 8 reps'],
  });
});

test('expired native rest still carries its deadline so native code shows Rest over', () => {
  assert.deepEqual(
    nativeLiveNotificationContent({ ...state, restUntil: nowMs }, nowMs - 90_000).rest,
    {
      startMs: nowMs - 90_000,
      endMs: nowMs,
    },
  );
});

test('native lines retain bodyweight, unit conversion and empty session fallbacks', () => {
  assert.deepEqual(nativeLiveNotificationContent({ ...state, weightKg: 0 }, null).lines, [
    'Barbell Squat',
    'Bodyweight × 8 reps',
  ]);
  assert.equal(
    nativeLiveNotificationContent({ ...state, unit: 'lb' }, null).lines[1],
    '220.5 lb × 8 reps',
  );
  assert.deepEqual(
    nativeLiveNotificationContent(
      { ...state, routineName: '', exerciseName: null, setNumber: null },
      null,
    ),
    { title: 'Workout', lines: ['Workout in progress'] },
  );
});

test('rest observations preserve the start across updates and extensions', () => {
  const first = observeNotificationRest(null, nowMs + 90_000, nowMs);
  assert.deepEqual(first, { startMs: nowMs, endMs: nowMs + 90_000 });
  assert.deepEqual(observeNotificationRest(first, nowMs + 90_000, nowMs + 10_000), first);
  assert.deepEqual(observeNotificationRest(first, nowMs + 120_000, nowMs + 30_000), {
    startMs: nowMs,
    endMs: nowMs + 120_000,
  });
});

test('cleared or replaced rests get a fresh start; expiry alone does not reset it', () => {
  const first = { startMs: nowMs, endMs: nowMs + 90_000 };
  assert.equal(observeNotificationRest(first, null, nowMs + 10_000), null);
  assert.deepEqual(observeNotificationRest(first, first.endMs, first.endMs + 1), first);
  assert.deepEqual(observeNotificationRest(first, nowMs + 60_000, nowMs + 10_000), {
    startMs: nowMs + 10_000,
    endMs: nowMs + 60_000,
  });
});

test('a normal set shows the routine, exercise and load without counters', () => {
  assert.deepEqual(liveNotificationContent(state), {
    title: 'Leg Day',
    body: 'Barbell Squat\n100 kg × 8 reps',
  });
});

test('pounds use the shared kilogram display conversion', () => {
  assert.match(liveNotificationContent({ ...state, unit: 'lb' }).body, /220\.5 lb × 8 reps/);
});

test('a running rest says when it ends', () => {
  const restUntil = nowMs + 90_000;
  assert.match(
    liveNotificationContent({ ...state, restUntil }).body,
    new RegExp(`Rest until ${timeLabel(restUntil)}$`),
  );
});

test('a rest is still running until its exact deadline', () => {
  assert.match(liveNotificationContent({ ...state, restUntil: nowMs + 1 }).body, /Rest until /);
});

test('rest is over at the exact deadline', () => {
  assert.match(liveNotificationContent({ ...state, restUntil: nowMs }).body, /Rest over$/);
});

test('an overdue rest stays finished', () => {
  assert.match(liveNotificationContent({ ...state, restUntil: nowMs - 60_000 }).body, /Rest over$/);
});

test('missing, empty and whitespace-only routine names fall back to Workout', () => {
  for (const routineName of [null, '', '   ']) {
    assert.equal(liveNotificationContent({ ...state, routineName }).title, 'Workout');
  }
});

test('missing or zero load is bodyweight', () => {
  for (const weightKg of [null, 0]) {
    assert.match(liveNotificationContent({ ...state, weightKg }).body, /Bodyweight × 8 reps/);
  }
});

test('missing reps are not invented', () => {
  assert.match(liveNotificationContent({ ...state, reps: null }).body, /\n100 kg$/m);
});

const session = {
  name: 'Leg Day',
  currentSessionExerciseId: 'squat',
  currentSetId: 's2',
  restUntil: null,
};
const exercises = [
  { id: 'squat', name: 'Squat' },
  { id: 'press', name: 'Press' },
];
const sets = [
  {
    id: 's1',
    sessionExerciseId: 'squat',
    position: 1,
    weightKg: 90,
    reps: 6,
    plannedWeightKg: 80,
    plannedReps: 8,
    completedAt: 100,
  },
  {
    id: 's2',
    sessionExerciseId: 'squat',
    position: 2,
    weightKg: null,
    reps: null,
    plannedWeightKg: 100,
    plannedReps: 8,
    completedAt: null,
  },
];

test('persisted cursor selects the current target without advancing it twice during rest', () => {
  const result = liveNotificationState(session, exercises, sets, 'kg');
  assert.equal(result.setNumber, 2);
  assert.equal(result.nextSetNumber, 2);
  assert.equal(result.weightKg, 100);
  assert.equal(result.reps, 8);
});

test('the dialled draft takes precedence over the target', () => {
  const result = liveNotificationState(
    session,
    exercises,
    [sets[0], { ...sets[1], weightKg: 102.5, reps: 5 }],
    'kg',
  );
  assert.equal(result.weightKg, 102.5);
  assert.equal(result.reps, 5);
});

test('unset target falls back to the last logged set of the current exercise', () => {
  const result = liveNotificationState(
    session,
    exercises,
    [sets[0], { ...sets[1], plannedWeightKg: null, plannedReps: null }],
    'kg',
  );
  assert.equal(result.weightKg, 90);
  assert.equal(result.reps, 6);
});

test('missing cursor falls back to the first exercise and its first incomplete set', () => {
  const result = liveNotificationState(
    { ...session, currentSessionExerciseId: 'deleted', currentSetId: 'deleted' },
    exercises,
    sets,
    'lb',
  );
  assert.equal(result.exerciseName, 'Squat');
  assert.equal(result.setNumber, 2);
  assert.equal(result.unit, 'lb');
});

test('removed exercises do not inflate progress or supply a last logged load', () => {
  const result = liveNotificationState(
    session,
    exercises,
    [...sets, { ...sets[0], id: 'removed', sessionExerciseId: 'removed', completedAt: 200 }],
    'kg',
  );
  assert.equal(result.totalSets, 2);
  assert.equal(result.completedSets, 1);
});

test('a completed bodyweight set preserves its missing load instead of using the target', () => {
  const result = liveNotificationState(
    session,
    exercises,
    [sets[0], { ...sets[1], completedAt: 200, reps: 10 }],
    'kg',
  );
  assert.equal(result.weightKg, null);
  assert.equal(result.nextSetNumber, null);
});

test('an empty session has no invented exercise or set', () => {
  const result = liveNotificationState({ ...session, name: '' }, [], [], 'kg');
  assert.deepEqual(liveNotificationContent({ ...result, nowMs }), {
    title: 'Workout',
    body: 'Workout in progress',
  });
});
