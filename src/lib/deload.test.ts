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

test('fewer than three sessions ever: too early', () => {
  assert.equal(
    deloadCall({ totalSessions: 2, muscles: hardQuads, lifts: [] }).lead,
    'Too early to call.',
  );
});

test('ceiling and stall: deload, naming both', () => {
  const r = deloadCall({
    totalSessions: 9,
    muscles: hardQuads,
    lifts: [{ name: 'Squat', stalled: true }],
  });
  assert.equal(r.lead, 'Deload next week.');
  assert.match(r.reason, /Quads/);
  assert.match(r.reason, /Squat/);
});

test('only one condition: not yet, and says which', () => {
  const a = deloadCall({
    totalSessions: 9,
    muscles: hardQuads,
    lifts: [{ name: 'Squat', stalled: false }],
  });
  assert.equal(a.lead, 'Not yet.');
  assert.match(a.reason, /Quads.*Squat keeps climbing/);
  const b = deloadCall({
    totalSessions: 9,
    muscles: okQuads,
    lifts: [{ name: 'Squat', stalled: true }],
  });
  assert.equal(b.lead, 'Not yet.');
  assert.match(b.reason, /Squat stopped climbing/);
  assert.match(
    deloadCall({ totalSessions: 9, muscles: okQuads, lifts: [] }).reason,
    /within range/,
  );
});

test('a muscle without a landmark never counts as near the ceiling', () => {
  const r = deloadCall({ totalSessions: 9, muscles: [muscle('Triceps', 40, null)], lifts: [] });
  assert.equal(r.lead, 'Not yet.');
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

test('neither condition: progress is only claimed for a lift that was judged', () => {
  const climbing = deloadCall({
    totalSessions: 9,
    muscles: okQuads,
    lifts: [{ name: 'Squat', stalled: false }],
  });
  assert.equal(climbing.lead, 'Not yet.');
  assert.match(climbing.reason, /Squat keeps climbing/);

  const unjudged = deloadCall({ totalSessions: 9, muscles: okQuads, lifts: [] });
  assert.equal(unjudged.lead, 'Not yet.');
  assert.doesNotMatch(unjudged.reason, /progress|climbing/);

  const empty = deloadCall({ totalSessions: 9, muscles: [], lifts: [] });
  assert.equal(empty.lead, 'Nothing to call yet.');
});
