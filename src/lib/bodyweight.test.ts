import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  byMonth,
  dailyWeights,
  isBodyweightKg,
  latest,
  resolveBodyweight,
  sevenDayAverage,
  thirtyDayChange,
  trendGeometry,
} from './bodyweight.ts';

/** Thursday 17 September 2026, local. */
const NOW = new Date(2026, 8, 17, 18, 0).getTime();
const at = (m: number, d: number, h = 8) => new Date(2026, m, d, h).getTime();
const r = (m: number, d: number, weightKg: number, h = 8) => ({
  measuredAt: at(m, d, h),
  weightKg,
});

test('the latest reading of a day wins, whatever the input order', () => {
  const days = dailyWeights([r(8, 17, 84, 20), r(8, 17, 83, 7), r(8, 16, 82)]);
  assert.deepEqual(
    days.map((d) => d.weightKg),
    [82, 84],
  );
  assert.equal(latest([r(8, 17, 84, 20), r(8, 17, 83, 7)]), 84);
  assert.equal(latest([]), null);
});

test('the seven-day average covers today and the six days before it', () => {
  const days = dailyWeights([r(8, 10, 100), r(8, 11, 80), r(8, 17, 90, 12)]);
  assert.equal(sevenDayAverage(days, NOW), 85);
});

test('the thirty-day change needs a reading a month back', () => {
  const now = dailyWeights([r(8, 17, 84)]);
  assert.equal(thirtyDayChange(now, NOW), null);
  const both = dailyWeights([r(7, 18, 82), r(8, 17, 84)]);
  assert.equal(thirtyDayChange(both, NOW), 2);
});

test('the trend window drops older days and puts today at the right edge', () => {
  const days = dailyWeights([r(8, 3, 80), r(8, 4, 81), r(8, 17, 83)]);
  const g = trendGeometry(days, NOW, 130, 88);
  assert.equal(g.points.length, 2);
  assert.equal(g.points[0].x, 0);
  assert.equal(g.points[1].x, 130);
  assert.ok(g.points[1].y < g.points[0].y);
  assert.equal(g.windowStart, new Date(2026, 8, 4).getTime());
  assert.equal(trendGeometry([], NOW, 130, 88).points.length, 0);
});

test('months come newest first with a change against the previous month', () => {
  const days = dailyWeights([r(7, 5, 80), r(7, 20, 82), r(8, 1, 83), r(9, 2, 85)]);
  const months = byMonth(days);
  assert.deepEqual(
    months.map((m) => [m.month, m.count, m.averageKg, m.changeKg]),
    [
      [9, 1, 85, 2],
      [8, 1, 83, 2],
      [7, 2, 81, null],
    ],
  );
});

test('deleting the latest reading of a day hands the day, and latest, to the one before', () => {
  const readings = [r(8, 17, 84, 20), r(8, 17, 83, 7), r(8, 16, 82)];
  const rest = readings.slice(1);
  assert.deepEqual(
    dailyWeights(rest).map((d) => d.weightKg),
    [82, 83],
  );
  assert.equal(latest(rest), 83);
  const onlyToday = rest.slice(0, 1);
  assert.deepEqual(
    dailyWeights(onlyToday).map((d) => d.weightKg),
    [83],
  );
  assert.equal(latest([]), null);
  assert.deepEqual(dailyWeights([]), []);
});

test('the stored range is 20 to 350 kg, ends included', () => {
  assert.equal(isBodyweightKg(20), true);
  assert.equal(isBodyweightKg(350), true);
  assert.equal(isBodyweightKg(19.9), false);
  assert.equal(isBodyweightKg(350.1), false);
  assert.equal(isBodyweightKg(Number.NaN), false);
});

test('typed digits resolve to one decimal in the unit, or null when the kilograms fall outside', () => {
  assert.equal(resolveBodyweight('82.45', 'kg'), 82.5);
  assert.equal(resolveBodyweight('82.', 'kg'), 82);
  assert.equal(resolveBodyweight('', 'kg'), null);
  assert.equal(resolveBodyweight('.', 'kg'), null);
  assert.equal(resolveBodyweight('19', 'kg'), null);
  assert.equal(resolveBodyweight('351', 'kg'), null);
  assert.equal(resolveBodyweight('180', 'lb'), 180);
  assert.equal(resolveBodyweight('40', 'lb'), null);
  assert.equal(resolveBodyweight('45', 'lb'), 45);
  assert.equal(resolveBodyweight('780', 'lb'), null);
});
