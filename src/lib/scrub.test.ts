import assert from 'node:assert/strict';
import { test } from 'node:test';

import { REPS_SCALE, RPE_SCALE, loadScale } from './scale.ts';
import { SCRUB_HYSTERESIS, scrubIndex } from './scrub.ts';

const ROW = 31;

test('no movement stays on the start detent', () => {
  assert.equal(scrubIndex(REPS_SCALE, 7, 0, ROW, 7), 7);
});

test('dragging up raises the index and dragging down lowers it, one detent per row', () => {
  assert.equal(scrubIndex(REPS_SCALE, 7, -ROW, ROW, 7), 8);
  assert.equal(scrubIndex(REPS_SCALE, 7, -3 * ROW, ROW, 7), 10);
  assert.equal(scrubIndex(REPS_SCALE, 7, ROW, ROW, 7), 6);
});

test('a fast drag skips straight to the detent under the finger', () => {
  assert.equal(scrubIndex(REPS_SCALE, 3, -6.2 * ROW, ROW, 3), 9);
});

test('the detent changes only past half a row plus the hysteresis', () => {
  const edge = (0.5 + SCRUB_HYSTERESIS) * ROW;
  assert.equal(scrubIndex(REPS_SCALE, 7, -(edge - 0.1), ROW, 7), 7);
  assert.equal(scrubIndex(REPS_SCALE, 7, -(edge + 0.5), ROW, 7), 8);
  assert.equal(scrubIndex(REPS_SCALE, 7, edge - 0.1, ROW, 7), 7);
  assert.equal(scrubIndex(REPS_SCALE, 7, edge + 0.5, ROW, 7), 6);
});

test('a finger resting on a boundary does not flicker between two detents', () => {
  let current = 7;
  const seen = new Set<number>();
  for (const dy of [-15, -16, -14.5, -15.5, -16, -15]) {
    current = scrubIndex(REPS_SCALE, 7, dy, ROW, current);
    seen.add(current);
  }
  assert.deepEqual([...seen], [7]);
});

test('once moved, coming back needs the same margin past the boundary', () => {
  const moved = scrubIndex(REPS_SCALE, 7, -25, ROW, 7);
  assert.equal(moved, 8);
  assert.equal(scrubIndex(REPS_SCALE, 7, -14, ROW, moved), 8);
  assert.equal(scrubIndex(REPS_SCALE, 7, -5, ROW, moved), 7);
});

test('clamps at both ends of the scale', () => {
  assert.equal(scrubIndex(REPS_SCALE, 13, -40 * ROW, ROW, 13), REPS_SCALE.n - 1);
  assert.equal(scrubIndex(REPS_SCALE, 1, 40 * ROW, ROW, 1), 0);
  assert.equal(scrubIndex(RPE_SCALE, RPE_SCALE.n - 1, -ROW, ROW, RPE_SCALE.n - 1), RPE_SCALE.n - 1);
  assert.ok(Object.is(scrubIndex(REPS_SCALE, 0, 0.6 * ROW, ROW, 0), 0));
});

test('works on the load scale in either unit', () => {
  const kg = loadScale(2.5, 'kg');
  assert.equal(scrubIndex(kg, 24, -2 * ROW, ROW, 24), 26);
  const lb = loadScale(2.5, 'lb');
  assert.equal(scrubIndex(lb, lb.n - 2, -5 * ROW, ROW, lb.n - 2), lb.n - 1);
});
