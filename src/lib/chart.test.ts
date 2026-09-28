import assert from 'node:assert/strict';
import { test } from 'node:test';

import { chartGeometry } from './chart.ts';

const Q1 = [112, 116, 114, 119, 121, 124, 122, 126, 128, 130];

test('chart heights follow the 12% floor formula', () => {
  const g = chartGeometry(Q1, 76);
  assert.equal(g.lo, 112);
  assert.equal(g.hi, 130);
  assert.ok(Math.abs(g.columns[0].height - (8 + 68 * (0.12 / 1.12))) < 1e-9);
  assert.ok(Math.abs(g.columns[9].height - 76) < 1e-9);
});

test('chart active -1 is the last column', () => {
  const g = chartGeometry(Q1, 76);
  assert.equal(g.activeIndex, 9);
  assert.deepEqual(
    g.columns.map((c) => c.active),
    Q1.map((_, i) => i === 9),
  );
  assert.equal(chartGeometry(Q1, 76, 2).activeIndex, 2);
});

test('chart with all-equal values has no NaN', () => {
  const g = chartGeometry([5, 5, 5], 76);
  for (const c of g.columns) assert.ok(Number.isFinite(c.height));
  assert.ok(Math.abs(g.columns[0].height - (8 + 68 * (0.12 / 1.12))) < 1e-9);
});

test('chart with a single value renders one active column', () => {
  const g = chartGeometry([3], 76);
  assert.equal(g.columns.length, 1);
  assert.equal(g.columns[0].active, true);
});

test('chart with no values has no columns', () => {
  assert.deepEqual(chartGeometry([], 76).columns, []);
});

test('an exact zero draws no column, and non-zero values keep the floor', () => {
  const { columns } = chartGeometry([6, 6, 2, 0, 0], 54);
  assert.equal(columns[3].height, 0);
  assert.equal(columns[4].height, 0);
  assert.ok(Math.abs(columns[0].height - 54) < 1e-9);
  // 2 of a 0..6 span still sits above the 8pt floor rather than collapsing.
  assert.ok(columns[2].height > 8);
});
