import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sessionSummaryStats, type SummarySet } from './session-summary.ts';

const set = (overrides: Partial<SummarySet> = {}): SummarySet => ({
  weightKg: 100,
  reps: 5,
  kind: 'working',
  completedAt: 1,
  rpe: null,
  e1rmKg: null,
  ...overrides,
});

test('empty sets leave every summary stat unavailable', () => {
  assert.deepEqual(sessionSummaryStats([], 600), {
    totalReps: null,
    heaviestSet: null,
    bestE1rmKg: null,
    averageRpe: null,
    densityKgPerMinute: null,
  });
});

test('summary stats exclude warmups and unperformed target values', () => {
  const stats = sessionSummaryStats(
    [
      set({ rpe: 8 }),
      set({ kind: 'warmup', weightKg: 200, reps: 10, rpe: 10, e1rmKg: 300 }),
      set({ completedAt: null, weightKg: 300, reps: 10, rpe: 10, e1rmKg: 400 }),
    ],
    600,
  );
  assert.equal(stats.totalReps, 5);
  assert.equal(stats.heaviestSet?.weightKg, 100);
  assert.equal(stats.heaviestSet?.reps, 5);
  assert.equal(stats.bestE1rmKg, 116.67);
  assert.equal(stats.averageRpe, 8);
  assert.equal(stats.densityKgPerMinute, 50);
});

test('warmup-only sessions have no working summary stats', () => {
  assert.deepEqual(sessionSummaryStats([set({ kind: 'warmup', rpe: 8 })], 600), {
    totalReps: null,
    heaviestSet: null,
    bestE1rmKg: null,
    averageRpe: null,
    densityKgPerMinute: null,
  });
});

test('total reps includes completed drop and failure sets', () => {
  const stats = sessionSummaryStats(
    [set(), set({ kind: 'drop', reps: 10 }), set({ kind: 'failure', reps: 3 })],
    120,
  );
  assert.equal(stats.totalReps, 18);
  assert.equal(stats.densityKgPerMinute, 900);
});

test('heaviest set breaks equal-weight ties by reps', () => {
  const stats = sessionSummaryStats([set(), set({ reps: 8 }), set({ weightKg: 90, reps: 12 })], 60);
  assert.equal(stats.heaviestSet?.weightKg, 100);
  assert.equal(stats.heaviestSet?.reps, 8);
});

test('best estimate uses stored e1RM and estimates sets without one', () => {
  const stats = sessionSummaryStats([set({ e1rmKg: 120 }), set({ weightKg: 110, reps: 6 })], 60);
  assert.equal(stats.bestE1rmKg, 132);
});

test('invalid estimation inputs leave the best estimate unavailable', () => {
  assert.equal(sessionSummaryStats([set({ reps: 20 }), set({ weightKg: 0 })], 60).bestE1rmKg, null);
});

test('average RPE ignores null values', () => {
  assert.equal(sessionSummaryStats([set(), set({ rpe: 8 }), set({ rpe: 9 })], 60).averageRpe, 8.5);
  assert.equal(sessionSummaryStats([set(), set()], 60).averageRpe, null);
});

test('density is unavailable for zero, missing or negative duration', () => {
  for (const duration of [0, null, -60]) {
    assert.equal(sessionSummaryStats([set()], duration).densityKgPerMinute, null);
  }
});

test('missing load and reps hide affected stats but retain recorded RPE', () => {
  assert.deepEqual(sessionSummaryStats([set({ weightKg: null, reps: null, rpe: 7 })], 60), {
    totalReps: null,
    heaviestSet: null,
    bestE1rmKg: null,
    averageRpe: 7,
    densityKgPerMinute: null,
  });
});

test('a known zero load retains reps, heaviest set and zero density', () => {
  const stats = sessionSummaryStats([set({ weightKg: 0, reps: 10 })], 60);
  assert.equal(stats.totalReps, 10);
  assert.equal(stats.heaviestSet?.weightKg, 0);
  assert.equal(stats.densityKgPerMinute, 0);
});
