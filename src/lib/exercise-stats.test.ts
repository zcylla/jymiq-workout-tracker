import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  countsForRecord,
  exerciseNumbers,
  type LoggedSet,
  REP_MAX_REPS,
  repMaxes,
} from './exercise-stats.ts';

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const NOW = Date.UTC(2026, 8, 30, 12, 0);

let n = 0;
const set = (over: Partial<LoggedSet> = {}): LoggedSet => ({
  sessionId: `s${n++}`,
  at: NOW - DAY,
  weightKg: 100,
  reps: 5,
  kind: 'working',
  completedAt: NOW - DAY,
  e1rmKg: 116.67,
  ...over,
});

test('only a performed, non-warm-up, non-drop set with a load counts', () => {
  assert.equal(countsForRecord(set()), true);
  assert.equal(countsForRecord(set({ kind: 'failure' })), true);
  assert.equal(countsForRecord(set({ kind: 'warmup' })), false);
  assert.equal(countsForRecord(set({ kind: 'drop' })), false);
  assert.equal(countsForRecord(set({ completedAt: null })), false);
  assert.equal(countsForRecord(set({ weightKg: 0 })), false);
  assert.equal(countsForRecord(set({ weightKg: null })), false);
  assert.equal(countsForRecord(set({ reps: 0 })), false);
  assert.equal(countsForRecord(set({ reps: null })), false);
});

test('an empty history is all dashes and no rep maxes', () => {
  assert.deepEqual(exerciseNumbers([], NOW, 'kg'), {
    bestE1rmKg: null,
    e1rmGain: null,
    topSetKg: null,
    sessions: 0,
    perWeek: null,
  });
  assert.deepEqual(
    repMaxes([]).map((r) => [r.reps, r.weightKg, r.source]),
    REP_MAX_REPS.map((reps) => [reps, null, null]),
  );
});

test('uncounted sets are ignored everywhere', () => {
  const junk = [
    set({ kind: 'warmup', weightKg: 200, e1rmKg: 233 }),
    set({ completedAt: null, weightKg: 200, e1rmKg: 233 }),
  ];
  assert.equal(exerciseNumbers(junk, NOW, 'kg').topSetKg, null);
  assert.equal(exerciseNumbers(junk, NOW, 'kg').sessions, 0);
  assert.equal(repMaxes(junk)[0].source, null);
});

test('one set: best e1RM and top set, no gain, no frequency', () => {
  const nums = exerciseNumbers([set()], NOW, 'kg');
  assert.equal(nums.bestE1rmKg, 116.67);
  assert.equal(nums.topSetKg, 100);
  assert.equal(nums.e1rmGain, null);
  assert.equal(nums.sessions, 1);
  assert.equal(nums.perWeek, null);
});

test('the gain is whole display units over the best before the session that set it', () => {
  const sets = [
    set({ at: NOW - 3 * WEEK, e1rmKg: 120 }),
    set({ at: NOW - 2 * WEEK, e1rmKg: 124.4 }),
    set({ at: NOW - WEEK, e1rmKg: 122 }),
  ];
  assert.equal(exerciseNumbers(sets, NOW, 'kg').bestE1rmKg, 124.4);
  assert.equal(exerciseNumbers(sets, NOW, 'kg').e1rmGain, 4);
});

test('a best that rounds level with the last one has no gain to show', () => {
  const sets = [set({ at: NOW - 2 * WEEK, e1rmKg: 120.1 }), set({ at: NOW - WEEK, e1rmKg: 120.4 })];
  assert.equal(exerciseNumbers(sets, NOW, 'kg').e1rmGain, null);
});

test('a best tied across sessions credits the first, so the gain is over what came before', () => {
  const sets = [
    set({ at: NOW - 3 * WEEK, e1rmKg: 110 }),
    set({ at: NOW - 2 * WEEK, e1rmKg: 120 }),
    set({ at: NOW - WEEK, e1rmKg: 120 }),
  ];
  assert.equal(exerciseNumbers(sets, NOW, 'kg').e1rmGain, 10);
});

test('the top set is the heaviest, ties to more reps', () => {
  const sets = [
    set({ weightKg: 102.5, reps: 3 }),
    set({ weightKg: 102.5, reps: 5 }),
    set({ weightKg: 100, reps: 8 }),
  ];
  assert.equal(exerciseNumbers(sets, NOW, 'kg').topSetKg, 102.5);
});

test('sessions count the last twelve weeks, once each however many sets', () => {
  const sets = [
    set({ sessionId: 'a', at: NOW - DAY }),
    set({ sessionId: 'a', at: NOW - DAY }),
    set({ sessionId: 'b', at: NOW - 11 * WEEK }),
    set({ sessionId: 'c', at: NOW - 13 * WEEK }),
  ];
  assert.equal(exerciseNumbers(sets, NOW, 'kg').sessions, 2);
});

test('frequency divides by the weeks the lift has existed, up to twelve', () => {
  const young = [set({ at: NOW - 4 * WEEK }), set({ at: NOW - 2 * WEEK }), set({ at: NOW - DAY })];
  assert.equal(exerciseNumbers(young, NOW, 'kg').perWeek, 0.75);
  const old = [set({ at: NOW - 40 * WEEK }), set({ at: NOW - 6 * WEEK }), set({ at: NOW - WEEK })];
  assert.equal(exerciseNumbers(old, NOW, 'kg').perWeek, 2 / 12);
});

test('frequency is a dash until the lift is a week old', () => {
  const sets = [set({ at: NOW - 3 * DAY }), set({ at: NOW - DAY })];
  assert.equal(exerciseNumbers(sets, NOW, 'kg').perWeek, null);
});

test('a rep max is the heaviest set at exactly that rep count, dated by its first lift', () => {
  const sets = [
    set({ weightKg: 110, reps: 5, at: NOW - 3 * WEEK }),
    set({ weightKg: 112.5, reps: 5, at: NOW - 2 * WEEK }),
    set({ weightKg: 112.5, reps: 5, at: NOW - WEEK }),
    set({ weightKg: 120, reps: 3, kind: 'warmup' }),
  ];
  const five = repMaxes(sets).find((r) => r.reps === 5);
  assert.deepEqual(five, { reps: 5, weightKg: 112.5, source: 'set', at: NOW - 2 * WEEK });
});

test('a rep count never lifted is estimated from the best e1RM', () => {
  const rows = repMaxes([set({ weightKg: 100, reps: 5, e1rmKg: 120 })]);
  assert.deepEqual(
    rows.find((r) => r.reps === 1),
    { reps: 1, weightKg: 120, source: 'est', at: null },
  );
  assert.deepEqual(
    rows.find((r) => r.reps === 3),
    { reps: 3, weightKg: 109.09, source: 'est', at: null },
  );
  assert.equal(rows.find((r) => r.reps === 5)?.source, 'set');
});

test('with no e1RM to estimate from, an unlifted rep count is empty', () => {
  const rows = repMaxes([set({ weightKg: 40, reps: 15, e1rmKg: null })]);
  assert.ok(rows.every((r) => r.source === null));
});
