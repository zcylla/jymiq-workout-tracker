import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  countByOrigin,
  DAY_MS,
  hasWorkoutPermissions,
  HEART_RATE_RETRY_MS,
  heartRateForSession,
  sessionsNeedingHeartRate,
  hasHeartRatePermission,
  type HeartRateCandidate,
  planWorkoutSync,
  WORKOUT_WINDOW_MS,
  workoutRecord,
  workoutWindowStart,
  type ExportableSession,
  healthStatus,
  healthStatusLabel,
  READ_RECORD_TYPES,
  WANTED_PERMISSIONS,
} from './health.ts';

const all = WANTED_PERMISSIONS;

test('wants the seven reads and the exercise-session write', () => {
  assert.equal(READ_RECORD_TYPES.length, 7);
  assert.equal(all.length, 8);
  assert.equal(READ_RECORD_TYPES.includes('ExerciseSession'), true);
  assert.deepEqual(
    all.filter((p) => p.accessType === 'write'),
    [{ accessType: 'write', recordType: 'ExerciseSession' }],
  );
});

test('sdk status 1 is unsupported, 2 needs an update, whatever was granted', () => {
  assert.equal(healthStatus(1, all), 'unsupported');
  assert.equal(healthStatus(2, all), 'needs_update');
  assert.equal(healthStatus(99, all), 'unsupported');
});

test('an available sdk maps the granted permissions to a state', () => {
  assert.equal(healthStatus(3, []), 'not_connected');
  assert.equal(healthStatus(3, all.slice(0, 3)), 'partial');
  assert.equal(healthStatus(3, all), 'connected');
});

test('a grant outside the wanted list does not count, and a repeat grant counts once', () => {
  const extra = [...all, { accessType: 'read' as const, recordType: 'Nutrition' }];
  assert.equal(healthStatus(3, extra), 'connected');
  assert.equal(healthStatus(3, [all[0], all[0], all[0]]), 'partial');
  assert.equal(healthStatus(3, [{ accessType: 'read', recordType: 'Nutrition' }]), 'not_connected');
});

test('every status has a label', () => {
  assert.equal(healthStatusLabel('unsupported'), 'Not available');
  assert.equal(healthStatusLabel('needs_update'), 'Update needed');
  assert.equal(healthStatusLabel('not_connected'), 'Not connected');
  assert.equal(healthStatusLabel('partial'), 'Partly allowed');
  assert.equal(healthStatusLabel('connected'), 'Connected');
});

test('countByOrigin groups, sorts by count, and names records with no origin', () => {
  const out = countByOrigin([
    { metadata: { dataOrigin: 'com.google.android.apps.fitness' } },
    { metadata: { dataOrigin: 'com.fitbit.FitbitMobile' } },
    { metadata: { dataOrigin: 'com.fitbit.FitbitMobile' } },
    {},
  ]);
  assert.deepEqual(out, [
    { origin: 'com.fitbit.FitbitMobile', count: 2 },
    { origin: 'com.google.android.apps.fitness', count: 1 },
    { origin: 'unknown', count: 1 },
  ]);
  assert.deepEqual(countByOrigin([]), []);
});

const NOW = Date.parse('2026-10-14T12:00:00Z');
const session = (over: Partial<ExportableSession> = {}): ExportableSession => ({
  id: 's1',
  name: 'Pull 1',
  status: 'completed',
  startedAt: NOW - 3_600_000,
  endedAt: NOW - 600_000,
  totalSets: 12,
  ...over,
});

test('workout access needs both the read and the write on exercise sessions', () => {
  const read = { accessType: 'read' as const, recordType: 'ExerciseSession' };
  const write = { accessType: 'write' as const, recordType: 'ExerciseSession' };
  assert.equal(hasWorkoutPermissions([read, write]), true);
  assert.equal(hasWorkoutPermissions([read]), false);
  assert.equal(hasWorkoutPermissions([write]), false);
  assert.equal(hasWorkoutPermissions([]), false);
});

test('a completed session becomes a record keyed by its own id', () => {
  assert.deepEqual(workoutRecord(session()), {
    clientRecordId: 's1',
    title: 'Pull 1',
    startTime: new Date(NOW - 3_600_000).toISOString(),
    endTime: new Date(NOW - 600_000).toISOString(),
  });
});

test('only a finished session with sets and a real duration is exportable', () => {
  assert.equal(workoutRecord(session({ status: 'in_progress' })), null);
  assert.equal(workoutRecord(session({ status: 'abandoned' })), null);
  assert.equal(workoutRecord(session({ endedAt: null })), null);
  assert.equal(workoutRecord(session({ endedAt: NOW - 3_600_000 })), null);
  assert.equal(workoutRecord(session({ totalSets: 0 })), null);
  assert.equal(workoutRecord(session({ totalSets: null })), null);
});

test('the window starts at the toggle time, but never more than 90 days back', () => {
  assert.equal(workoutWindowStart(NOW - DAY_MS, NOW), NOW - DAY_MS);
  assert.equal(workoutWindowStart(NOW - 200 * DAY_MS, NOW), NOW - WORKOUT_WINDOW_MS);
});

test('a completed session with no record is written', () => {
  const plan = planWorkoutSync([session()], [], NOW - DAY_MS, NOW);
  assert.deepEqual(
    plan.write.map((r) => r.clientRecordId),
    ['s1'],
  );
  assert.deepEqual(plan.remove, []);
});

test('a session that already has a record is neither rewritten nor removed', () => {
  const plan = planWorkoutSync([session()], ['s1'], NOW - DAY_MS, NOW);
  assert.deepEqual(plan, { write: [], remove: [] });
});

test('a record whose session is gone is removed', () => {
  const plan = planWorkoutSync([], ['gone'], NOW - DAY_MS, NOW);
  assert.deepEqual(plan, { write: [], remove: ['gone'] });
});

test('sessions that ended before the toggle was switched on are never written', () => {
  const old = session({
    id: 'old',
    startedAt: NOW - 3 * DAY_MS,
    endedAt: NOW - 3 * DAY_MS + 3_000_000,
  });
  assert.deepEqual(planWorkoutSync([old], [], NOW - DAY_MS, NOW).write, []);
});

test('a known session just outside the window protects its record from removal', () => {
  const edge = session({
    id: 'edge',
    startedAt: NOW - DAY_MS - 1000,
    endedAt: NOW - DAY_MS + 1000,
  });
  const plan = planWorkoutSync([edge], ['edge'], NOW - DAY_MS, NOW);
  assert.deepEqual(plan.remove, []);
});

test('a session that exists but is not exportable keeps an existing record untouched', () => {
  const plan = planWorkoutSync([session({ totalSets: 0 })], ['s1'], NOW - DAY_MS, NOW);
  assert.deepEqual(plan, { write: [], remove: [] });
});

const T0 = Date.parse('2026-10-14T10:00:00Z');
const MIN = 60_000;
const hr = (minute: number, bpm: number) => ({ time: T0 + minute * MIN, bpm });

test('heart rate averages and maxes only the samples inside the window', () => {
  const samples = [hr(-5, 200), hr(0, 100), hr(10, 140), hr(20, 120), hr(30, 160), hr(45, 190)];
  assert.deepEqual(heartRateForSession(samples, T0, T0 + 30 * MIN), { avg: 130, max: 160 });
});

test('heart rate rounds the average to a whole number', () => {
  const samples = [hr(0, 100), hr(10, 101), hr(20, 101)];
  assert.deepEqual(heartRateForSession(samples, T0, T0 + 20 * MIN), { avg: 101, max: 101 });
});

test('no samples in the window means no value', () => {
  assert.equal(heartRateForSession([], T0, T0 + 30 * MIN), null);
  assert.equal(heartRateForSession([hr(-10, 90), hr(40, 90)], T0, T0 + 30 * MIN), null);
});

test('samples that stop short of the end of the session are not trusted yet', () => {
  const partial = [hr(0, 100), hr(5, 110), hr(10, 120)];
  assert.equal(heartRateForSession(partial, T0, T0 + 30 * MIN), null);
  const nearly = [...partial, hr(28.5, 125)];
  assert.deepEqual(heartRateForSession(nearly, T0, T0 + 30 * MIN), { avg: 114, max: 125 });
});

test('only finished, recent sessions without a value are candidates', () => {
  const now = T0 + 60 * MIN;
  const s = (over: Partial<HeartRateCandidate> = {}): HeartRateCandidate => ({
    id: 'a',
    status: 'completed',
    startedAt: T0,
    endedAt: T0 + 30 * MIN,
    avgHr: null,
    ...over,
  });
  assert.deepEqual(
    sessionsNeedingHeartRate([s()], now).map((x) => x.id),
    ['a'],
  );
  assert.deepEqual(sessionsNeedingHeartRate([s({ avgHr: 120 })], now), []);
  assert.deepEqual(sessionsNeedingHeartRate([s({ status: 'in_progress' })], now), []);
  assert.deepEqual(sessionsNeedingHeartRate([s({ status: 'abandoned' })], now), []);
  assert.deepEqual(sessionsNeedingHeartRate([s({ endedAt: null })], now), []);
  assert.deepEqual(sessionsNeedingHeartRate([s({ endedAt: T0 })], now), []);
  assert.deepEqual(sessionsNeedingHeartRate([s()], T0 + 30 * MIN + HEART_RATE_RETRY_MS + 1), []);
});

test('heart rate needs the read permission', () => {
  assert.equal(hasHeartRatePermission([{ accessType: 'read', recordType: 'HeartRate' }]), true);
  assert.equal(hasHeartRatePermission([{ accessType: 'write', recordType: 'HeartRate' }]), false);
  assert.equal(hasHeartRatePermission([]), false);
});
