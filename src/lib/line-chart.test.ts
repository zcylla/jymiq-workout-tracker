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

test('zoom stays between the full series and four slots, even for short series', async () => {
  const { chartWindow } = await import('./line-chart.ts');
  assert.deepEqual(chartWindow(12, 0.2, 99), { start: 0, count: 12 });
  assert.deepEqual(chartWindow(12, 100, 99), { start: 8, count: 4 });
  assert.deepEqual(chartWindow(3, 100, 99), { start: 0, count: 3 });
  assert.deepEqual(chartWindow(0, 5, 10), { start: 0, count: 0 });
});

test('pinch keeps the focal slot stationary and clamps both edges', async () => {
  const { chartWindow, zoomWindow, slotToX } = await import('./line-chart.ts');
  const full = chartWindow(12, 1, 0);
  const focal = slotToX(5, full, W);
  const zoomed = zoomWindow(12, full, 2, focal, focal, W);
  assert.equal(zoomed.count, 6);
  assert.ok(Math.abs(slotToX(5, zoomed, W) - focal) < 1e-9);
  assert.equal(zoomWindow(12, full, 100, INSET, INSET, W).start, 0);
  assert.equal(zoomWindow(12, full, 100, W - INSET, W - INSET, W).start, 8);
  assert.deepEqual(zoomWindow(12, zoomed, 0.01, focal, focal, W), full);
});

test('moving the pinch focal point translates the window without changing scale', async () => {
  const { zoomWindow, slotToX } = await import('./line-chart.ts');
  const initial = { start: 3, count: 6 };
  const focal = slotToX(5, initial, W);
  const next = zoomWindow(12, initial, 1, focal, focal + 20, W);
  assert.ok(Math.abs(slotToX(5, next, W) - focal - 20) < 1e-9);
});

test('pan follows the finger and never leaves the series', async () => {
  const { panWindow } = await import('./line-chart.ts');
  const initial = { start: 3, count: 4 };
  assert.equal(panWindow(12, initial, 48, W).start, 2);
  assert.equal(panWindow(12, initial, 1000, W).start, 0);
  assert.equal(panWindow(12, initial, -1000, W).start, 8);
  assert.deepEqual(panWindow(12, { start: 0, count: 12 }, -50, W), { start: 0, count: 12 });
});

test('only visible points set the range, fitted trend and latest peak', async () => {
  const { windowGeometry } = await import('./line-chart.ts');
  const { geometry: g, points } = windowGeometry(
    at(1000, 1, 3, 5, 7, -999),
    { start: 1, count: 4 },
    W,
    H,
  );
  assert.deepEqual(
    points.map((p) => p.slot),
    [1, 2, 3, 4],
  );
  assert.equal(g.lo, 1);
  assert.equal(g.hi, 7);
  assert.equal(g.peak, 3);
  assert.ok(g.trend);
  assert.ok(Math.abs(g.trend.y1 - g.points[0].y) < 1e-9);
  const empty = windowGeometry([{ slot: 0, value: 100 }], { start: 4, count: 4 }, W, H);
  assert.equal(empty.geometry.peak, -1);
  assert.equal(empty.geometry.trend, null);
});

test('point picking uses x distance, rejects gaps and ignores points outside the window', async () => {
  const { nearestPoint, slotToX } = await import('./line-chart.ts');
  const points = [
    { slot: 0, value: 2 },
    { slot: 4, value: 3 },
    { slot: 11, value: 5 },
  ];
  const window = { start: 0, count: 12 };
  const x = slotToX(4, window, W);
  assert.equal(nearestPoint(points, window, x + 24, W), 1);
  assert.equal(nearestPoint(points, window, x + 25, W), -1);
  assert.equal(nearestPoint(points, { start: 5, count: 4 }, x, W), -1);
  assert.equal(nearestPoint([], window, x, W), -1);
});

test('tooltip placement flips at the right edge and stays inside small plots', async () => {
  const { tooltipPosition } = await import('./line-chart.ts');
  assert.deepEqual(tooltipPosition(10, 70, 300, 96, 180, 66), { left: 20, top: 0 });
  assert.deepEqual(tooltipPosition(290, 10, 300, 96, 180, 66), { left: 100, top: 20 });
  assert.deepEqual(tooltipPosition(70, 40, 100, 96, 100, 66), { left: 0, top: 30 });
});

test('every fractional zoom window contains at least four slots and stays inside the history', async () => {
  const { chartWindow, visibleSlots } = await import('./line-chart.ts');
  for (const slots of [1, 3, 4, 5, 12, 36, 360]) {
    for (const scale of [0.5, 1, 1.3, 2.8, 1000]) {
      for (const offset of [-99, 0, 0.49, 1.5, 7.23, 9999]) {
        const window = chartWindow(slots, scale, offset);
        const range = visibleSlots(window, slots);
        assert.ok(window.start >= 0 && window.start + window.count <= slots + 1e-9);
        assert.ok(range.last - range.first + 1 >= Math.min(4, slots));
      }
    }
  }
});

test('taps select another point, toggle the same point off and clear on empty space', async () => {
  const { selectionAt, slotToX } = await import('./line-chart.ts');
  const points = [
    { slot: 0, value: 2 },
    { slot: 11, value: 5 },
  ];
  const window = { start: 0, count: 12 };
  const first = slotToX(0, window, W);
  const last = slotToX(11, window, W);
  assert.equal(selectionAt(points, window, -1, first, W), 0);
  assert.equal(selectionAt(points, window, 0, first, W), -1);
  assert.equal(selectionAt(points, window, 0, last, W), 1);
  assert.equal(selectionAt(points, window, 1, W / 2, W), -1);
});
