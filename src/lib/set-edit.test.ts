import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estimate1RM } from './e1rm.ts';
import { liveNotificationState, observeNotificationRest } from './live-notification.ts';
import { liveE1rm, loadDelta } from './live-readout.ts';
import {
  editedSetValues,
  editedSessionTotals,
  replayExerciseRecords,
  type RecordSet,
} from './set-edit.ts';

const lift = (id: string, weightKg: number, at: number, sessionId = 's1'): RecordSet => ({
  id,
  sessionId,
  weightKg,
  reps: 5,
  rpe: null,
  kind: 'working',
  completedAt: at,
  e1rmKg: estimate1RM(weightKg, 5),
});
const session = { startedAt: 0, pausedMs: 0, endedAt: null };

test('logged load edit refreshes e1RM without completion or order fields', () => {
  assert.deepEqual(editedSetValues(lift('a', 100, 1000), { weightKg: 80 }), {
    weightKg: 80,
    e1rmKg: estimate1RM(80, 5),
  });
});
test('logged rep edit clears e1RM beyond the estimate range', () => {
  assert.deepEqual(editedSetValues(lift('a', 100, 1000), { reps: 15 }), { reps: 15, e1rmKg: null });
});
test('RPE-only edit preserves the logged estimate', () => {
  assert.deepEqual(editedSetValues(lift('a', 100, 1000), { rpe: 9 }), { rpe: 9 });
});
test('draft edits do not freeze an estimate', () => {
  assert.deepEqual(
    editedSetValues({ ...lift('a', 100, 1000), completedAt: null }, { weightKg: 80 }),
    { weightKg: 80 },
  );
});
test('a logged set cannot lose its load or reps', () => {
  for (const patch of [
    { weightKg: null },
    { weightKg: -1 },
    { weightKg: Infinity },
    { reps: null },
    { reps: 0 },
    { reps: 1.5 },
  ]) {
    assert.throws(() => editedSetValues(lift('a', 100, 1000), patch));
  }
});
test('zero load is allowed and has no estimated 1RM', () => {
  assert.deepEqual(editedSetValues(lift('a', 100, 1000), { weightKg: 0 }), {
    weightKg: 0,
    e1rmKg: null,
  });
});
test('live totals include performed non-warmup sets and leave duration open', () => {
  const rows = [
    lift('a', 80, 1000),
    { ...lift('b', 100, 2000), kind: 'warmup' as const },
    { ...lift('c', 90, 3000), completedAt: null },
  ];
  assert.deepEqual(editedSessionTotals(session, rows), { totalVolumeKg: 400, totalSets: 1 });
});
test('finished duration uses original finish and completion times', () => {
  assert.deepEqual(editedSessionTotals({ ...session, endedAt: 60000 }, [lift('a', 80, 1000)]), {
    totalVolumeKg: 400,
    totalSets: 1,
    durationSec: 60,
  });
});
test('long finished duration retains the existing last-lift fallback', () => {
  assert.equal(
    editedSessionTotals({ ...session, endedAt: 100000000 }, [lift('a', 80, 60000)]).durationSec,
    60,
  );
});
test('lowering an earlier record promotes a later set and repairs its previous value', () => {
  const records = replayExerciseRecords([lift('a', 80, 1000), lift('b', 90, 2000)], []);
  const weights = records.filter((r) => r.category === 'heaviest');
  assert.deepEqual(
    weights.map((r) => [r.setId, r.value, r.previousValue]),
    [
      ['a', 80, null],
      ['b', 90, 80],
    ],
  );
});
test('raising an earlier set retracts a later record it now beats', () => {
  const records = replayExerciseRecords([lift('a', 110, 1000), lift('b', 100, 2000)], []);
  assert.deepEqual(
    records.filter((r) => r.category === 'heaviest').map((r) => r.setId),
    ['a'],
  );
});
test('PR replay follows completion chronology rather than display order', () => {
  const records = replayExerciseRecords([lift('b', 90, 2000), lift('a', 80, 1000)], []);
  assert.deepEqual(
    records.filter((r) => r.category === 'heaviest').map((r) => r.setId),
    ['a', 'b'],
  );
});
test('PR replay retains familiar-weight rep rules and ignores drafts, warmups and drops', () => {
  const rows = [
    lift('a', 80, 1000),
    { ...lift('b', 80, 2000), reps: 8 },
    { ...lift('c', 200, 3000), completedAt: null },
    { ...lift('d', 200, 4000), kind: 'warmup' as const },
    { ...lift('e', 200, 5000), kind: 'drop' as const },
  ];
  const records = replayExerciseRecords(rows, []);
  assert.deepEqual(
    records.filter((r) => r.category === 'most_reps_at_weight').map((r) => r.setId),
    ['b'],
  );
  assert.ok(records.every((r) => r.setId === 'a' || r.setId === 'b'));
});
test('session volume PRs replay from corrected sets without ending a live session', () => {
  const rows = [lift('a', 80, 1000), lift('b', 90, 3000, 's2')];
  const records = replayExerciseRecords(rows, [
    { id: 's1', status: 'completed', endedAt: 2000 },
    { id: 's2', status: 'in_progress', endedAt: null },
  ]);
  assert.deepEqual(
    records.filter((r) => r.category === 'best_session_volume').map((r) => [r.sessionId, r.value]),
    [['s1', 400]],
  );
});
test('lowered finished volume promotes a later session-volume record', () => {
  const records = replayExerciseRecords(
    [lift('a', 80, 1000), lift('b', 90, 3000, 's2')],
    [
      { id: 's1', status: 'completed', endedAt: 2000 },
      { id: 's2', status: 'completed', endedAt: 4000 },
    ],
  );
  assert.deepEqual(
    records
      .filter((r) => r.category === 'best_session_volume')
      .map((r) => [r.value, r.previousValue]),
    [
      [400, null],
      [450, 400],
    ],
  );
});

test('corrected logged load feeds the live estimate and LAST TIME delta', () => {
  const row = lift('a', 100, 1000);
  const edited = { ...row, ...editedSetValues(row, { weightKg: 80 }) };
  assert.equal(liveE1rm([edited], 80, 5), estimate1RM(80, 5));
  assert.deepEqual(loadDelta(edited.weightKg!, 90), { text: '−10', sign: -1 });
});

test('editing a logged set refreshes notification values while retaining its rest identity', () => {
  const row = {
    ...lift('a', 100, 1000),
    sessionExerciseId: 'sx',
    position: 1,
    plannedWeightKg: null,
    plannedReps: null,
  };
  const current = {
    id: 's1',
    name: 'Workout',
    currentSessionExerciseId: 'sx',
    currentSetId: 'a',
    restUntil: 20000,
  };
  const exercises = [{ id: 'sx', name: 'Lift' }];
  const before = liveNotificationState(current, exercises, [row], 'kg');
  const edited = { ...row, ...editedSetValues(row, { weightKg: 80, reps: 8, rpe: 9 }) };
  const after = liveNotificationState(current, exercises, [edited], 'kg');
  assert.equal(after.weightKg, 80);
  assert.equal(after.reps, 8);
  assert.equal(after.completedSets, 1);
  assert.equal(after.restUntil, before.restUntil);
  assert.equal(after.restKey, before.restKey);
  assert.equal(
    observeNotificationRest(
      { startMs: 1000, endMs: 20000, key: before.restKey },
      after.restUntil,
      5000,
      after.restKey,
    )?.startMs,
    1000,
  );
});

test('RPE can be cleared on a logged set without undoing it', () => {
  const row = { ...lift('a', 100, 1000), rpe: 9 };
  const edited = { ...row, ...editedSetValues(row, { rpe: null }) };
  assert.equal(edited.rpe, null);
  assert.equal(edited.completedAt, 1000);
  assert.equal(edited.e1rmKg, row.e1rmKg);
});
