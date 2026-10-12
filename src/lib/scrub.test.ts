import assert from 'node:assert/strict';
import { test } from 'node:test';

import { REPS_SCALE, RPE_SCALE, loadScale } from './scale.ts';
import {
  FREE_ABOVE_DPS,
  GLIDE_SECONDS,
  SCRUB_HYSTERESIS,
  SNAP_BELOW_DPS,
  freedom,
  magnet,
  release,
  scrubIndex,
} from './scrub.ts';

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

test('freedom is 0 at or below the snap speed, 1 at or above the free speed, and monotonic', () => {
  assert.equal(freedom(0), 0);
  assert.equal(freedom(SNAP_BELOW_DPS), 0);
  assert.equal(freedom(-SNAP_BELOW_DPS), 0);
  assert.equal(freedom(FREE_ABOVE_DPS), 1);
  assert.equal(freedom(-5 * FREE_ABOVE_DPS), 1);
  let last = 0;
  for (let v = 0; v <= FREE_ABOVE_DPS + 2; v += 0.25) {
    assert.ok(freedom(v) >= last);
    last = freedom(v);
  }
});

test('a slow release lands on the nearest detent', () => {
  assert.equal(release(REPS_SCALE, 7.3, 1.5).target, 7);
  assert.equal(release(REPS_SCALE, 7.6, -1.5).target, 8);
  assert.equal(release(REPS_SCALE, 7.2, 0).target, 7);
});

test('a fast release projects further in the direction of motion', () => {
  const kg = loadScale(2.5, 'kg');
  assert.equal(release(kg, 20, 20).target, 20 + Math.round(20 * GLIDE_SECONDS));
  assert.equal(release(kg, 20, -20).target, 20 - Math.round(20 * GLIDE_SECONDS));
  assert.ok(release(kg, 20, 8).target > 20);
  assert.ok(release(kg, 20, 8).target < release(kg, 20, 20).target);
});

test('the release spring is critically damped and starts toward its target', () => {
  const { target, config } = release(loadScale(2.5, 'kg'), 20.2, 20);
  assert.equal(config.damping / (2 * Math.sqrt(config.stiffness * config.mass)), 1);
  assert.ok(Math.sign(config.velocity) === Math.sign(target - 20.2));
  assert.ok(config.energyThreshold > 0 && config.energyThreshold <= 1);
});

test('a release clamps at both ends of the scale', () => {
  assert.equal(release(REPS_SCALE, REPS_SCALE.n - 2, 100).target, REPS_SCALE.n - 1);
  assert.equal(release(REPS_SCALE, 1, -100).target, 0);
});

test('a slow drag is pulled toward the nearest detent; a fast one tracks the finger', () => {
  const slow = magnet(REPS_SCALE, 7.3, 7, 0);
  assert.ok(slow < 7.3 && slow > 7);
  assert.ok(magnet(REPS_SCALE, 6.7, 7, 0) > 6.7);
  assert.equal(magnet(REPS_SCALE, 7.3, 7, FREE_ABOVE_DPS), 7.3);
  assert.equal(magnet(REPS_SCALE, 7.3, 7, -2 * FREE_ABOVE_DPS), 7.3);
});

test('a slow drag holds its detent past the half-way line, then jumps', () => {
  assert.equal(Math.round(magnet(REPS_SCALE, 7.5 + SCRUB_HYSTERESIS - 0.01, 7, 0)), 7);
  assert.equal(Math.round(magnet(REPS_SCALE, 7.5 + SCRUB_HYSTERESIS + 0.01, 7, 0)), 8);
});

test('a slow drag resting on a boundary does not flicker between two detents', () => {
  let current = 7;
  const seen = new Set<number>();
  for (const raw of [7.45, 7.55, 7.5, 7.6, 7.4, 7.55]) {
    current = Math.round(magnet(REPS_SCALE, raw, current, 1));
    seen.add(current);
  }
  assert.deepEqual([...seen], [7]);
});

test('the shown detent always matches the held one at any drag speed', () => {
  for (let v = 0; v <= FREE_ABOVE_DPS; v += 0.5) {
    let current = 7;
    for (let raw = 7; raw <= 9; raw += 0.01) {
      const pos = magnet(REPS_SCALE, raw, current, v);
      assert.ok(Math.abs(pos - Math.round(pos)) <= 0.5);
      current = Math.round(pos);
      assert.ok(Math.abs(raw - current) <= 0.5 + SCRUB_HYSTERESIS + 1e-9);
    }
  }
});

test('a drag clamps at both ends of the scale', () => {
  assert.equal(magnet(REPS_SCALE, REPS_SCALE.n + 3, REPS_SCALE.n - 1, 0), REPS_SCALE.n - 1);
  assert.equal(magnet(REPS_SCALE, -2, 0, 0), 0);
});
