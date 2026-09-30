import assert from 'node:assert/strict';
import { test } from 'node:test';

import { INSET, lineGeometry } from './line-chart.ts';

const W = 200;
const H = 80;
const at = (...values: number[]) => values.map((value, slot) => ({ slot, value }));

test('the range is the data, the lowest point sits on the floor and the highest at the top', () => {
  const g = lineGeometry(at(100, 120, 110), 3, W, H, null);
  assert.equal(g.lo, 100);
  assert.equal(g.hi, 120);
  assert.equal(g.points[0].x, INSET);
  assert.equal(g.points[2].x, W - INSET);
  assert.equal(g.points[0].y, H - INSET);
  assert.equal(g.points[1].y, INSET);
  assert.equal(g.points[2].y, H / 2);
  assert.equal(g.peak, 1);
  assert.equal(g.flat, false);
});

test('points are placed by slot, so a gap keeps its width', () => {
  const g = lineGeometry(
    [
      { slot: 0, value: 1 },
      { slot: 1, value: 2 },
      { slot: 5, value: 3 },
    ],
    6,
    W,
    H,
    null,
  );
  assert.equal(g.points[1].x, INSET + (W - 2 * INSET) / 5);
  assert.equal(g.points[2].x, W - INSET);
});

test('equal values draw a level line mid-height', () => {
  const g = lineGeometry(at(100, 100, 100), 3, W, H, { slope: 0, intercept: 100 });
  assert.equal(g.flat, true);
  assert.deepEqual(
    g.points.map((p) => p.y),
    [H / 2, H / 2, H / 2],
  );
  assert.equal(g.peak, 2);
  assert.equal(g.trend?.y1, H / 2);
  assert.equal(g.trend?.y2, H / 2);
});

test('a single point sits at the right edge with no trend', () => {
  const g = lineGeometry(at(100), 1, W, H, null);
  assert.equal(g.points[0].x, W - INSET);
  assert.equal(g.points[0].y, H / 2);
  assert.equal(g.flat, true);
  assert.equal(g.trend, null);
});

test('no points is nothing to draw', () => {
  const g = lineGeometry([], 0, W, H, null);
  assert.deepEqual(g.points, []);
  assert.equal(g.peak, -1);
  assert.equal(g.trend, null);
});

test('the peak is the latest of equal highs', () => {
  assert.equal(lineGeometry(at(5, 9, 3, 9, 4), 5, W, H, null).peak, 3);
});

test('the trend runs between the first and last point along the fitted line', () => {
  const g = lineGeometry(at(100, 120, 110), 3, W, H, { slope: 5, intercept: 102 });
  assert.equal(g.trend?.x1, INSET);
  assert.equal(g.trend?.x2, W - INSET);
  assert.ok(g.trend);
  assert.ok(Math.abs(g.trend.y1 - 68.8) < 1e-9);
  assert.ok(Math.abs(g.trend.y2 - 32.8) < 1e-9);
});
