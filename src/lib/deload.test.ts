import assert from 'node:assert/strict';
import { test } from 'node:test';

import { deloadCall, isStalled, liftsThisWeek } from './deload.ts';
import type { MuscleRow } from './landmarks.ts';

const muscle = (name: string, sets: number, high: number | null): MuscleRow => ({
  muscle: name.toLowerCase(),
  name,
  sets,
  landmark: high === null ? null : { low: 8, high, cap: 20 },
  verdict: null,
});

const hardQuads = [muscle('Quads', 17, 16)];
const okQuads = [muscle('Quads', 12, 16)];
const climbing = [{ name: 'Squat', stalled: false }];
const stalled = [{ name: 'Squat', stalled: true }];

test('fewer than three sessions ever: no call', () => {
  assert.equal(deloadCall({ totalSessions: 2, muscles: hardQuads, lifts: stalled }), null);
});

test('no sets this week: no call', () => {
  assert.equal(deloadCall({ totalSessions: 9, muscles: [], lifts: [] }), null);
  assert.equal(
    deloadCall({ totalSessions: 9, muscles: [muscle('Quads', 0, 16)], lifts: [] }),
    null,
  );
});

test('ceiling and stall: deload', () => {
  assert.equal(deloadCall({ totalSessions: 9, muscles: hardQuads, lifts: stalled }), 'DELOAD');
});

test('only one condition: hold', () => {
  assert.equal(deloadCall({ totalSessions: 9, muscles: hardQuads, lifts: climbing }), 'HOLD');
  assert.equal(deloadCall({ totalSessions: 9, muscles: okQuads, lifts: stalled }), 'HOLD');
  assert.equal(deloadCall({ totalSessions: 9, muscles: hardQuads, lifts: [] }), 'HOLD');
});

test('neither condition: not yet, judged lifts or not', () => {
  assert.equal(deloadCall({ totalSessions: 9, muscles: okQuads, lifts: climbing }), 'NOT YET');
  assert.equal(deloadCall({ totalSessions: 9, muscles: okQuads, lifts: [] }), 'NOT YET');
});

test('a muscle without a landmark never counts as near the ceiling', () => {
  const r = deloadCall({ totalSessions: 9, muscles: [muscle('Triceps', 40, null)], lifts: [] });
  assert.equal(r, 'NOT YET');
});

test('stall: two sessions cannot stall, a rise is not a stall, a flat or lower last is', () => {
  assert.equal(isStalled([100, 100]), false);
  assert.equal(isStalled([100, 105, 110]), false);
  assert.equal(isStalled([100, 110, 110]), true);
  assert.equal(isStalled([100, 110, 105]), true);
  assert.equal(isStalled([50, 100, 105, 110]), false);
});

test('liftsThisWeek ignores lifts not trained this week or with too little history', () => {
  const s = (id: string, at: number, e: number) => ({ sessionId: id, at, bestE1rmKg: e });
  const out = liftsThisWeek(
    [
      { name: 'Squat', sessions: [s('a', 1, 100), s('b', 2, 110), s('c', 10, 110)] },
      { name: 'Bench', sessions: [s('a', 1, 100), s('b', 10, 105)] },
      { name: 'Row', sessions: [s('a', 1, 100), s('b', 2, 105), s('c', 3, 110)] },
    ],
    5,
  );
  assert.deepEqual(out, [{ name: 'Squat', stalled: true }]);
});
