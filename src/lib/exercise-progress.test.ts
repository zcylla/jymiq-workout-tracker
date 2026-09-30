import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estimate1RM } from './e1rm.ts';
import {
  axisLabels,
  bucketStart,
  buckets,
  comparePeriods,
  metricValue,
  periodChange,
  progressSeries,
  regression,
  trendOf,
} from './exercise-progress.ts';
import type { LoggedSet } from './exercise-stats.ts';
import type { SetKind } from './volume.ts';

const ms = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).getTime();

const set = (
  y: number,
  m: number,
  d: number,
  weightKg: number,
  reps: number,
  extra: { kind?: SetKind; session?: string; h?: number; performed?: boolean } = {},
): LoggedSet => {
  const at = ms(y, m, d, extra.h ?? 10);
  return {
    sessionId: extra.session ?? `${y}-${m}-${d}`,
    at,
    weightKg,
    reps,
    kind: extra.kind ?? 'working',
    completedAt: extra.performed === false ? null : at,
    e1rmKg: estimate1RM(weightKg, reps),
  };
};

const dayStart = (y: number, m: number, d: number) => new Date(y, m - 1, d).getTime();

test('a week starts on Monday: Sunday night belongs to the week before', () => {
  assert.equal(bucketStart(ms(2026, 9, 13, 23), 'week'), dayStart(2026, 9, 7));
  assert.equal(bucketStart(new Date(2026, 8, 14, 0, 0).getTime(), 'week'), dayStart(2026, 9, 14));
  assert.equal(bucketStart(ms(2026, 9, 17), 'week'), dayStart(2026, 9, 14));
});

test('a week can span New Year, a month and a year cannot', () => {
  const dec31 = new Date(2025, 11, 31, 23, 59).getTime();
  const jan1 = new Date(2026, 0, 1, 0, 0).getTime();
  assert.equal(bucketStart(dec31, 'week'), dayStart(2025, 12, 29));
  assert.equal(bucketStart(jan1, 'week'), dayStart(2025, 12, 29));
  assert.equal(bucketStart(dec31, 'month'), dayStart(2025, 12, 1));
  assert.equal(bucketStart(jan1, 'month'), dayStart(2026, 1, 1));
  assert.equal(bucketStart(dec31, 'year'), dayStart(2025, 1, 1));
  assert.equal(bucketStart(jan1, 'year'), dayStart(2026, 1, 1));
  assert.equal(bucketStart(dec31, 'day'), dayStart(2025, 12, 31));
});

test('29 February is a day of February and the week of Monday the 28th', () => {
  const leap = ms(2028, 2, 29);
  assert.equal(bucketStart(leap, 'day'), dayStart(2028, 2, 29));
  assert.equal(bucketStart(leap, 'week'), dayStart(2028, 2, 28));
  assert.equal(bucketStart(leap, 'month'), dayStart(2028, 2, 1));
  assert.equal(bucketStart(ms(2028, 3, 1), 'month'), dayStart(2028, 3, 1));
});

test('only sets that count are aggregated, into one bucket per period', () => {
  const bs = buckets(
    [
      set(2026, 9, 14, 100, 5, { session: 'a' }),
      set(2026, 9, 14, 110, 3, { session: 'a' }),
      set(2026, 9, 14, 60, 10, { kind: 'warmup', session: 'a' }),
      set(2026, 9, 14, 90, 8, { kind: 'drop', session: 'a' }),
      set(2026, 9, 14, 200, 5, { performed: false, session: 'a' }),
      set(2026, 9, 14, 0, 12, { session: 'a' }),
      set(2026, 9, 14, 140, 0, { session: 'a' }),
      set(2026, 9, 14, 80, 12, { session: 'b', h: 18 }),
    ],
    'day',
  );
  assert.equal(bs.length, 1);
  const [b] = bs;
  assert.equal(b.start, dayStart(2026, 9, 14));
  assert.equal(b.weightKg, 110);
  assert.equal(b.reps, 12);
  assert.equal(b.volumeKg, 100 * 5 + 110 * 3 + 80 * 12);
  assert.equal(b.sessions, 2);
  assert.equal(b.e1rmKg, estimate1RM(110, 3));
});

test('buckets come back oldest first whatever the input order', () => {
  const bs = buckets(
    [set(2026, 9, 17, 100, 5), set(2026, 9, 1, 90, 5), set(2026, 9, 9, 95, 5)],
    'week',
  );
  assert.deepEqual(
    bs.map((b) => b.start),
    [dayStart(2026, 8, 31), dayStart(2026, 9, 7), dayStart(2026, 9, 14)],
  );
});

test('a bucket with only high-rep sets has no e1RM but still has weight, volume and reps', () => {
  const [b] = buckets([set(2026, 9, 14, 40, 15)], 'day');
  assert.equal(b.e1rmKg, null);
  assert.equal(metricValue(b, 'e1rm'), null);
  assert.equal(metricValue(b, 'weight'), 40);
  assert.equal(metricValue(b, 'volume'), 600);
  assert.equal(metricValue(b, 'reps'), 15);
  const series = progressSeries([b], 'day', 'e1rm', ms(2026, 9, 17));
  assert.deepEqual(series.points, []);
  assert.equal(progressSeries([b], 'day', 'reps', ms(2026, 9, 17)).points.length, 1);
});

test('empty input gives empty buckets, series, labels and no comparison', () => {
  const now = ms(2026, 9, 17);
  for (const g of ['day', 'week', 'month', 'year'] as const) {
    const bs = buckets([], g);
    assert.deepEqual(bs, []);
    const s = progressSeries(bs, g, 'e1rm', now);
    assert.deepEqual(s.points, []);
    assert.deepEqual(axisLabels(s, g), []);
    assert.deepEqual(comparePeriods(bs, g, now), { current: null, previous: null });
  }
});

test('day window is the last 14 training days, and rest days take no room', () => {
  const sets = Array.from({ length: 20 }, (_, i) => set(2026, 6, 1 + i * 2, 100 + i, 5));
  const s = progressSeries(buckets(sets, 'day'), 'day', 'weight', ms(2026, 9, 17));
  assert.equal(s.points.length, 14);
  assert.equal(s.slots, 14);
  assert.deepEqual(
    s.points.map((p) => p.slot),
    Array.from({ length: 14 }, (_, i) => i),
  );
  assert.equal(s.points[0].value, 106);
  assert.equal(s.points[13].value, 119);
  assert.equal(s.points[0].start, dayStart(2026, 6, 13));
});

test('week window is 12 calendar weeks ending this one, slots by distance', () => {
  const now = ms(2026, 9, 17);
  const s = progressSeries(
    buckets(
      [
        set(2026, 9, 15, 100, 5),
        set(2026, 7, 6, 90, 5),
        set(2026, 6, 29, 80, 5),
        set(2026, 6, 25, 70, 5),
      ],
      'week',
    ),
    'week',
    'weight',
    now,
  );
  assert.equal(s.slots, 12);
  assert.deepEqual(
    s.points.map((p) => [p.slot, p.value]),
    [
      [0, 80],
      [1, 90],
      [11, 100],
    ],
  );
  assert.equal(s.starts[0], dayStart(2026, 6, 29));
  assert.equal(s.starts[11], dayStart(2026, 9, 14));
});

test('month window is 12 calendar months; 31 Dec and 1 Jan are different slots', () => {
  const now = ms(2026, 1, 15);
  const s = progressSeries(
    buckets(
      [
        set(2025, 12, 31, 100, 5),
        set(2026, 1, 1, 105, 5),
        set(2025, 2, 1, 90, 5),
        set(2025, 1, 31, 80, 5),
      ],
      'month',
    ),
    'month',
    'weight',
    now,
  );
  assert.equal(s.slots, 12);
  assert.deepEqual(
    s.points.map((p) => [p.slot, p.value]),
    [
      [0, 90],
      [10, 100],
      [11, 105],
    ],
  );
  assert.equal(s.starts[0], dayStart(2025, 2, 1));
  assert.equal(s.starts[11], dayStart(2026, 1, 1));
});

test('year window is all years with data up to six, ending this year', () => {
  const now = ms(2026, 9, 17);
  const many = progressSeries(
    buckets(
      [2019, 2020, 2021, 2023, 2026].map((y, i) => set(y, 3, 3, 100 + i, 5)),
      'year',
    ),
    'year',
    'weight',
    now,
  );
  assert.equal(many.slots, 6);
  assert.deepEqual(
    many.points.map((p) => [p.slot, p.value]),
    [
      [0, 102],
      [2, 103],
      [5, 104],
    ],
  );
  const one = progressSeries(buckets([set(2026, 3, 3, 100, 5)], 'year'), 'year', 'weight', now);
  assert.equal(one.slots, 1);
  assert.deepEqual(
    one.points.map((p) => p.slot),
    [0],
  );
  const since = progressSeries(
    buckets([set(2024, 3, 3, 100, 5), set(2026, 3, 3, 110, 5)], 'year'),
    'year',
    'weight',
    now,
  );
  assert.equal(since.slots, 3);
});

test('volume is the sum of weight x reps and reps the most in one set', () => {
  const bs = buckets(
    [set(2026, 9, 14, 100, 5), set(2026, 9, 14, 100, 4), set(2026, 9, 15, 50, 20)],
    'week',
  );
  const now = ms(2026, 9, 17);
  assert.deepEqual(
    progressSeries(bs, 'week', 'volume', now).points.map((p) => p.value),
    [100 * 5 + 100 * 4 + 50 * 20],
  );
  assert.deepEqual(
    progressSeries(bs, 'week', 'reps', now).points.map((p) => p.value),
    [20],
  );
});

test('axis labels are first, middle and last, without repeats', () => {
  const sets = Array.from({ length: 5 }, (_, i) => set(2026, 9, 1 + i, 100 + i, 5));
  const day = progressSeries(buckets(sets, 'day'), 'day', 'weight', ms(2026, 9, 17));
  assert.deepEqual(axisLabels(day, 'day'), ['1 SEP', '3 SEP', '5 SEP']);

  const two = progressSeries(buckets(sets.slice(0, 2), 'day'), 'day', 'weight', ms(2026, 9, 17));
  assert.deepEqual(axisLabels(two, 'day'), ['1 SEP', '2 SEP']);

  const one = progressSeries(buckets(sets.slice(0, 1), 'day'), 'day', 'weight', ms(2026, 9, 17));
  assert.deepEqual(axisLabels(one, 'day'), ['1 SEP']);

  const week = progressSeries(buckets(sets, 'week'), 'week', 'weight', ms(2026, 9, 17));
  assert.deepEqual(axisLabels(week, 'week'), ['29 JUN', '3 AUG', '14 SEP']);

  const month = progressSeries(buckets(sets, 'month'), 'month', 'weight', ms(2026, 9, 17));
  assert.deepEqual(axisLabels(month, 'month'), ["OCT '25", "MAR '26", "SEP '26"]);

  const year = progressSeries(buckets(sets, 'year'), 'year', 'weight', ms(2026, 9, 17));
  assert.deepEqual(axisLabels(year, 'year'), ['2026']);
});

test('regression fits a line through slot and value', () => {
  const r = regression([
    { slot: 0, value: 10 },
    { slot: 1, value: 12 },
    { slot: 2, value: 14 },
  ]);
  assert.ok(r);
  assert.ok(Math.abs(r.slope - 2) < 1e-9);
  assert.ok(Math.abs(r.intercept - 10) < 1e-9);
});

test('regression needs two points, and equal values have no slope', () => {
  assert.equal(regression([]), null);
  assert.equal(regression([{ slot: 3, value: 100 }]), null);
  const flat = regression([
    { slot: 0, value: 100 },
    { slot: 4, value: 100 },
    { slot: 7, value: 100 },
  ]);
  assert.ok(flat);
  assert.equal(flat.slope, 0);
  assert.equal(flat.intercept, 100);
});

test('regression is over slots, so a gap in time weighs what it spans', () => {
  const r = regression([
    { slot: 0, value: 100 },
    { slot: 1, value: 101 },
    { slot: 11, value: 111 },
  ]);
  assert.ok(r);
  assert.ok(Math.abs(r.slope - 1) < 1e-9);
});

test('the trend is flat under 2% of the mean across the plotted span', () => {
  const at = (...values: number[]) => values.map((value, slot) => ({ slot, value }));
  assert.equal(trendOf(at(100, 110)), 'up');
  assert.equal(trendOf(at(110, 100)), 'down');
  assert.equal(trendOf(at(100, 101)), 'flat');
  assert.equal(trendOf(at(101, 100)), 'flat');
  assert.equal(trendOf(at(100, 100, 100)), 'flat');
  assert.equal(trendOf(at(100, 104)), 'up');
  assert.equal(trendOf(at(100)), null);
  assert.equal(trendOf([]), null);
});

test('day comparison is the latest training day against the one before it', () => {
  const bs = buckets(
    [set(2026, 9, 1, 100, 5), set(2026, 9, 8, 105, 5), set(2026, 9, 10, 110, 5)],
    'day',
  );
  const { current, previous } = comparePeriods(bs, 'day', ms(2026, 9, 30));
  assert.equal(current?.start, dayStart(2026, 9, 10));
  assert.equal(previous?.start, dayStart(2026, 9, 8));
});

test('a single training day has no previous day', () => {
  const bs = buckets([set(2026, 9, 1, 100, 5)], 'day');
  const { current, previous } = comparePeriods(bs, 'day', ms(2026, 9, 30));
  assert.equal(current?.weightKg, 100);
  assert.equal(previous, null);
});

test('week comparison is calendar weeks: Sunday is last week, Monday is this one', () => {
  const bs = buckets([set(2026, 9, 13, 100, 5), set(2026, 9, 14, 105, 5)], 'week');
  const monday = comparePeriods(bs, 'week', new Date(2026, 8, 14, 9, 0).getTime());
  assert.equal(monday.current?.weightKg, 105);
  assert.equal(monday.previous?.weightKg, 100);

  const sunday = comparePeriods(bs, 'week', new Date(2026, 8, 13, 23, 0).getTime());
  assert.equal(sunday.current?.weightKg, 100);
  assert.equal(sunday.previous, null);
});

test('a previous period with no data is null, never an older period', () => {
  const bs = buckets([set(2026, 9, 15, 100, 5), set(2026, 8, 3, 90, 5)], 'week');
  const { current, previous } = comparePeriods(bs, 'week', ms(2026, 9, 17));
  assert.equal(current?.weightKg, 100);
  assert.equal(previous, null);
});

test('a current period with no data is null even when the past has data', () => {
  const bs = buckets([set(2026, 9, 1, 100, 5)], 'week');
  assert.deepEqual(comparePeriods(bs, 'week', ms(2026, 9, 30)), { current: null, previous: null });
});

test('month comparison steps over 29 February and year comparison over New Year', () => {
  const months = buckets([set(2028, 2, 29, 100, 5), set(2028, 3, 1, 105, 5)], 'month');
  const m = comparePeriods(months, 'month', ms(2028, 3, 10));
  assert.equal(m.current?.weightKg, 105);
  assert.equal(m.previous?.weightKg, 100);

  const years = buckets([set(2025, 12, 31, 100, 5), set(2026, 1, 1, 110, 5)], 'year');
  const y = comparePeriods(years, 'year', ms(2026, 1, 2));
  assert.equal(y.current?.weightKg, 110);
  assert.equal(y.previous?.weightKg, 100);
});

test('a change is signed, in whole units, from the rounded figures that are printed', () => {
  assert.equal(periodChange(160, 155), 5);
  assert.equal(periodChange(150, 155), -5);
  assert.equal(periodChange(155, 155), 0);
  assert.equal(periodChange(100.4, 99.6), 0);
  assert.equal(periodChange(null, 155), null);
  assert.equal(periodChange(155, null), null);
  assert.equal(periodChange(null, null), null);
  const lb = (kg: number) => kg * 2.2046226218;
  assert.equal(periodChange(100, 99.6, lb), 0);
  assert.equal(periodChange(100, 90, lb), 22);
});
