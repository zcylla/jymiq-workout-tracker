import assert from 'node:assert/strict';
import { test } from 'node:test';

import { REST_SCALE, indexOf, snapTo, stepBy, valueAt } from './scale.ts';

test('the rest scale has 5 s, 15 s and 30 s zones', () => {
  const all = Array.from({ length: REST_SCALE.n }, (_, i) => valueAt(REST_SCALE, i));
  assert.equal(all[0], 15);
  assert.equal(all[all.length - 1], 600);
  assert.equal(REST_SCALE.n, 44);
  for (let i = 1; i < all.length; i++) {
    const gap = all[i] - all[i - 1];
    assert.equal(gap, all[i] <= 120 ? 5 : all[i] <= 300 ? 15 : 30);
  }
});

test('indexOf snaps to the nearest stop and clamps at both ends', () => {
  assert.equal(valueAt(REST_SCALE, indexOf(REST_SCALE, 0)), 15);
  assert.equal(valueAt(REST_SCALE, indexOf(REST_SCALE, 9999)), 600);
  assert.equal(snapTo(REST_SCALE, 137), 135);
  assert.equal(snapTo(REST_SCALE, 180), 180);
});

test('a 15 s step moves 15 s while detents allow it and one detent beyond', () => {
  assert.equal(stepBy(REST_SCALE, 90, 15), 105);
  assert.equal(stepBy(REST_SCALE, 90, -15), 75);
  assert.equal(stepBy(REST_SCALE, 120, 15), 135);
  assert.equal(stepBy(REST_SCALE, 300, 15), 330);
  assert.equal(stepBy(REST_SCALE, 330, -15), 300);
  assert.equal(stepBy(REST_SCALE, 330, 15), 360);
});

test('a step stops at the ends of the scale', () => {
  assert.equal(stepBy(REST_SCALE, 600, 15), 600);
  assert.equal(stepBy(REST_SCALE, 15, -15), 15);
  assert.equal(stepBy(REST_SCALE, 20, -15), 15);
});
