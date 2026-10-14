import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  countByOrigin,
  healthStatus,
  healthStatusLabel,
  READ_RECORD_TYPES,
  WANTED_PERMISSIONS,
} from './health.ts';

const all = WANTED_PERMISSIONS;

test('wants the six reads and the exercise-session write', () => {
  assert.equal(READ_RECORD_TYPES.length, 6);
  assert.equal(all.length, 7);
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
