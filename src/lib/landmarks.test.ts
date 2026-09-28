import assert from 'node:assert/strict';
import { test } from 'node:test';

import { barPct, LANDMARKS, muscleRows, verdict } from './landmarks.ts';

const Q = LANDMARKS.quads!;

test('verdict bands and their boundaries', () => {
  assert.equal(verdict(Q.low - 1, Q).word, 'TOO FEW');
  assert.equal(verdict(Q.low, Q).word, 'GOOD');
  assert.equal(verdict(Q.high, Q).word, 'GOOD');
  assert.equal(verdict(Q.high + 1, Q).word, 'HARD');
  assert.equal(verdict(Q.cap - 1, Q).word, 'HARD');
  assert.equal(verdict(Q.cap, Q).word, 'TOO MUCH');
  assert.equal(verdict(Q.cap + 5, Q).tone, 'live');
  assert.equal(verdict(0, Q).tone, 'tick2');
  assert.equal(verdict(Q.low, Q).tone, 'done');
  assert.equal(verdict(Q.high + 1, Q).tone, 'accent');
});

test('bar position is a percentage of the cap, clamped', () => {
  assert.equal(barPct(10, 20), 50);
  assert.equal(barPct(30, 20), 100);
});

test('rows: warm-ups and unlogged sets never count, landmarked first, rest by sets', () => {
  const s = (muscle: string, kind: 'working' | 'warmup' = 'working', done = true) => ({
    muscle,
    kind,
    weightKg: 100,
    reps: 5,
    completedAt: done ? 1 : null,
  });
  const rows = muscleRows([
    s('triceps'),
    s('triceps'),
    s('lower_back'),
    s('quads'),
    s('quads', 'warmup'),
    s('quads', 'working', false),
    s('chest'),
    s('calves', 'warmup'),
  ]);
  assert.deepEqual(
    rows.map((r) => [r.name, r.sets]),
    [
      ['Chest', 1],
      ['Quads', 1],
      ['Triceps', 2],
      ['Lower back', 1],
    ],
  );
  assert.equal(rows[2]!.verdict, null);
  assert.equal(rows[0]!.verdict?.word, 'TOO FEW');
});
