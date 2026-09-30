import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveKeypadValue } from './keypad.ts';
import { formatWeight, toDisplay, toKg } from './units.ts';

import {
  LOAD_SCALE,
  LOAD_STEPS_KG,
  REST_SCALE,
  indexOf,
  loadScale,
  loadDisplayStep,
  targetLoadScale,
  snapTo,
  stepBy,
  valueAt,
} from './scale.ts';

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

test('every offered increment keeps the 20 to 140 kg span', () => {
  for (const step of LOAD_STEPS_KG) {
    const scale = loadScale(step);
    assert.equal(valueAt(scale, 0), 20);
    assert.equal(valueAt(scale, scale.n - 1), 140);
    assert.equal(scale.n, 120 / step + 1);
  }
});

test('every detent is a multiple of the increment, with no float drift', () => {
  for (const step of LOAD_STEPS_KG) {
    const scale = loadScale(step);
    for (let i = 0; i < scale.n; i++) {
      const v = valueAt(scale, i);
      assert.equal(Math.round((v / step) * 1000) % 1000, 0, `${v} on ${step}`);
      assert.equal(indexOf(scale, v), i);
      if (i > 0) assert.equal(Math.round((v - valueAt(scale, i - 1)) * 1000), step * 1000);
    }
  }
});

test('a major rule is every 10 kg and a numeral every 20 kg, whatever the step', () => {
  for (const step of LOAD_STEPS_KG) {
    const scale = loadScale(step);
    assert.equal(Number.isInteger(scale.major), true);
    assert.equal(Number.isInteger(scale.label), true);
    assert.equal(scale.major * step, 10);
    assert.equal(scale.label * step, 20);
  }
});

test('a logged load between detents snaps to the nearest one and the ends clamp', () => {
  assert.equal(snapTo(loadScale(5), 82.5), 85);
  assert.equal(snapTo(loadScale(1.25), 82.5), 82.5);
  assert.equal(snapTo(loadScale(1), 82.4), 82);
  assert.equal(snapTo(loadScale(5), 10), 20);
  assert.equal(snapTo(loadScale(5), 200), 140);
});

test('the default load scale is the 2.5 kg one the app shipped with', () => {
  assert.deepEqual(LOAD_SCALE, loadScale(2.5));
  assert.equal(LOAD_SCALE.n, 49);
  assert.equal(LOAD_SCALE.major, 4);
  assert.equal(LOAD_SCALE.label, 8);
});

test('live load increments use practical display-unit steps', () => {
  for (const [kg, lb] of [
    [1, 2],
    [1.25, 2.5],
    [2.5, 5],
    [5, 10],
  ]) {
    assert.equal(loadDisplayStep(kg, 'kg'), kg);
    assert.equal(loadDisplayStep(kg, 'lb'), lb);
    assert.deepEqual(loadScale(kg, 'kg'), loadScale(kg));
    const scale = loadScale(kg, 'lb');
    assert.equal(scale.step, lb);
    assert.equal(scale.major * lb, 20);
    assert.equal(scale.label * lb, 40);
  }
});

test('pound detents round trip through stored kg without a float tail', () => {
  for (const step of [1, ...LOAD_STEPS_KG]) {
    const scale = loadScale(step, 'lb');
    for (let i = 0; i < scale.n; i++) {
      const display = valueAt(scale, i);
      const kg = toKg(display, 'lb');
      assert.equal(kg, Number(kg.toFixed(3)));
      assert.equal(formatWeight(kg, 'lb'), String(display));
      assert.equal(indexOf(scale, toDisplay(kg, 'lb')), i);
    }
  }
});

test('live pound keypad input stores kilograms and reads back in pounds', () => {
  const display = resolveKeypadValue('100', targetLoadScale('lb'));
  assert.equal(display, 100);
  assert.equal(toKg(display!, 'lb'), 45.359);
  assert.equal(formatWeight(toKg(display!, 'lb'), 'lb'), '100');
});
