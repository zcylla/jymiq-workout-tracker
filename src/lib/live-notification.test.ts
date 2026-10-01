import assert from 'node:assert/strict';
import { test } from 'node:test';

import { liveNotificationContent, liveNotificationState } from './live-notification.ts';
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

test('normal set shows the routine, current set, load and progress', () => {
  assert.deepEqual(liveNotificationContent(state), {
    title: 'Leg Day',
    body: 'Barbell Squat · Set 3 of 5\n100 kg × 8 reps\n2 of 5 sets logged',
  });
});

test('pounds use the shared kilogram display conversion', () => {
  assert.match(liveNotificationContent({ ...state, unit: 'lb' }).body, /220\.5 lb × 8 reps/);
});

test('running rest includes the absolute end and a snapshot of time remaining', () => {
  const restUntil = nowMs + 90_000;
  assert.match(
    liveNotificationContent({ ...state, restUntil }).body,
    new RegExp(`Resting until ${timeLabel(restUntil)} · 1:30 left`),
  );
});

test('remaining rest rounds up and uses the supplied clock', () => {
  assert.match(liveNotificationContent({ ...state, restUntil: nowMs + 1001 }).body, /0:02 left/);
});

test('rest ends at the exact deadline and names the current upcoming set', () => {
  assert.match(
    liveNotificationContent({ ...state, restUntil: nowMs }).body,
    /Rest over — Set 3 next/,
  );
});

test('an overdue rest stays finished', () => {
  assert.match(
    liveNotificationContent({ ...state, restUntil: nowMs - 60_000 }).body,
    /Rest over — Set 3 next/,
  );
});

test('the last completed set does not promise a nonexistent next set', () => {
  assert.match(
    liveNotificationContent({
      ...state,
      restUntil: nowMs,
      nextSetNumber: null,
      completedSets: 5,
    }).body,
    /Rest over — All sets logged/,
  );
});

test('missing, empty and whitespace-only routine names fall back to Workout', () => {
  for (const routineName of [null, '', '   ']) {
    assert.equal(liveNotificationContent({ ...state, routineName }).title, 'Workout');
  }
});

test('first and last sets keep their one-based positions', () => {
  for (const setNumber of [1, 5]) {
    assert.match(
      liveNotificationContent({ ...state, setNumber }).body,
      new RegExp(`Set ${setNumber} of 5`),
    );
  }
});

test('missing or zero load is bodyweight', () => {
  for (const weightKg of [null, 0]) {
    assert.match(liveNotificationContent({ ...state, weightKg }).body, /Bodyweight × 8 reps/);
  }
});

test('missing reps are not invented', () => {
  assert.match(liveNotificationContent({ ...state, reps: null }).body, /\n100 kg\n/);
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
    body: 'Workout in progress\n0 of 0 sets logged',
  });
});
