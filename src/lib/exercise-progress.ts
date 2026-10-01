import { visibleSlots, type ChartWindow } from './line-chart.ts';
import { mondayIndex } from './calendar.ts';
import { countsForRecord, type LoggedSet } from './exercise-stats.ts';
import type { Kg } from './units.ts';

export type Granularity = 'day' | 'week' | 'month' | 'year' | 'all';
export type Metric = 'e1rm' | 'weight' | 'volume' | 'reps';
export type Trend = 'up' | 'down' | 'flat';

/** What one training day, Monday-first week, calendar month or year holds of a lift. */
export interface Bucket {
  /** Local midnight of the bucket's first day. */
  start: number;
  e1rmKg: Kg | null;
  weightKg: Kg;
  volumeKg: Kg;
  reps: number;
  sessions: number;
}

export interface SeriesPoint {
  slot: number;
  start: number;
  value: number;
}

/** Points sit on `slots` evenly spaced positions; `starts[slot]` is where each one begins. */
export interface Series {
  points: SeriesPoint[];
  slots: number;
  starts: number[];
}

export const DAY_POINTS = 14;
export const WEEK_SLOTS = 12;
export const MONTH_SLOTS = 12;
export const YEAR_SLOTS = 6;

/** The trend is flat when the fitted line moves less than this share of the mean across the plotted span. */
export const FLAT_BELOW = 0.02;

const WEEK_MS = 7 * 86_400_000;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Local-time calendar arithmetic through `Date`, so DST never moves a boundary. */
export function bucketStart(at: number, gran: Granularity): number {
  const d = new Date(at);
  const [y, m, day] = [d.getFullYear(), d.getMonth(), d.getDate()];
  if (gran === 'day') return new Date(y, m, day).getTime();
  if (gran === 'week') return new Date(y, m, day - mondayIndex(d)).getTime();
  if (gran === 'month' || gran === 'all') return new Date(y, m, 1).getTime();
  return new Date(y, 0, 1).getTime();
}

/** One bucket per period that has a counted set, oldest first. */
export function buckets(all: readonly LoggedSet[], gran: Granularity): Bucket[] {
  const acc = new Map<number, Bucket & { ids: Set<string> }>();
  for (const s of all) {
    if (!countsForRecord(s)) continue;
    const start = bucketStart(s.at, gran);
    const b = acc.get(start) ?? {
      start,
      e1rmKg: null,
      weightKg: 0,
      volumeKg: 0,
      reps: 0,
      sessions: 0,
      ids: new Set<string>(),
    };
    const weightKg = s.weightKg as Kg;
    const reps = s.reps as number;
    if (s.e1rmKg != null && (b.e1rmKg === null || s.e1rmKg > b.e1rmKg)) b.e1rmKg = s.e1rmKg;
    if (weightKg > b.weightKg) b.weightKg = weightKg;
    if (reps > b.reps) b.reps = reps;
    b.volumeKg += weightKg * reps;
    b.ids.add(s.sessionId);
    acc.set(start, b);
  }
  return [...acc.values()]
    .sort((a, b) => a.start - b.start)
    .map(({ ids, ...b }) => ({ ...b, sessions: ids.size }));
}

export function metricValue(b: Bucket, metric: Metric): number | null {
  if (metric === 'e1rm') return b.e1rmKg;
  if (metric === 'weight') return b.weightKg;
  if (metric === 'volume') return b.volumeKg;
  return b.reps;
}

const EMPTY: Series = { points: [], slots: 0, starts: [] };

/**
 * The chart's points. Only buckets with a value are points, so a rest day is
 * never a zero. D is the last 14 training days, spaced by count; W and M are
 * the last 12 calendar weeks / months, spaced by time; Y is the calendar years
 * from the first with data (at most six) to this one.
 */
export function progressSeries(
  bs: readonly Bucket[],
  gran: Granularity,
  metric: Metric,
  now: number,
): Series {
  const valid = bs.flatMap((b) => {
    const value = metricValue(b, metric);
    return value === null ? [] : [{ start: b.start, value }];
  });
  if (!valid.length && !(gran === 'all' && bs.length)) return EMPTY;

  if (gran === 'day') {
    const last = valid.slice(-DAY_POINTS);
    return {
      points: last.map((p, slot) => ({ slot, ...p })),
      slots: last.length,
      starts: last.map((p) => p.start),
    };
  }

  const today = new Date(now);
  let slots: number;
  let startOf: (slot: number) => number;
  let slotOf: (start: number) => number;

  if (gran === 'week') {
    const from = new Date(bucketStart(now, 'week'));
    const at = (slot: number) =>
      new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7 * (slot - WEEK_SLOTS + 1));
    slots = WEEK_SLOTS;
    startOf = (slot) => at(slot).getTime();
    slotOf = (start) => Math.round((start - at(0).getTime()) / WEEK_MS);
  } else if (gran === 'month' || gran === 'all') {
    const currentMonth = today.getFullYear() * 12 + today.getMonth();
    const first = new Date(bs[0].start);
    const base =
      gran === 'all'
        ? first.getFullYear() * 12 + first.getMonth()
        : currentMonth - (MONTH_SLOTS - 1);
    slots = Math.max(1, currentMonth - base + 1);
    startOf = (slot) => new Date(Math.floor((base + slot) / 12), (base + slot) % 12, 1).getTime();
    slotOf = (start) => {
      const d = new Date(start);
      return d.getFullYear() * 12 + d.getMonth() - base;
    };
  } else {
    const firstYear = Math.max(
      new Date(valid[0].start).getFullYear(),
      today.getFullYear() - (YEAR_SLOTS - 1),
    );
    slots = today.getFullYear() - firstYear + 1;
    startOf = (slot) => new Date(firstYear + slot, 0, 1).getTime();
    slotOf = (start) => new Date(start).getFullYear() - firstYear;
  }

  return {
    points: valid
      .map((p) => ({ slot: slotOf(p.start), ...p }))
      .filter((p) => p.slot >= 0 && p.slot < slots),
    slots,
    starts: Array.from({ length: slots }, (_, slot) => startOf(slot)),
  };
}

export function axisLabel(start: number, gran: Granularity): string {
  const d = new Date(start);
  if (gran === 'year') return String(d.getFullYear());
  if (gran === 'month' || gran === 'all')
    return `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** The first, middle and last slot of the window, or fewer when they coincide. Nothing when there is nothing to label. */
export function axisLabels(series: Series, gran: Granularity, window?: ChartWindow): string[] {
  if (!series.points.length) return [];
  const { first, last } = visibleSlots(window ?? { start: 0, count: series.slots }, series.slots);
  if (last < first) return [];
  const picks = [...new Set([first, Math.floor((first + last) / 2), last])];
  return picks.map((i) => axisLabel(series.starts[i], gran));
}

/** Least squares of value on slot. Null under two points. */
export function regression(
  points: readonly { slot: number; value: number }[],
): { slope: number; intercept: number } | null {
  const n = points.length;
  if (n < 2) return null;
  const mx = points.reduce((a, p) => a + p.slot, 0) / n;
  const my = points.reduce((a, p) => a + p.value, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sxy += (p.slot - mx) * (p.value - my);
    sxx += (p.slot - mx) ** 2;
  }
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx };
}

export function trendOf(points: readonly { slot: number; value: number }[]): Trend | null {
  const fit = regression(points);
  if (!fit) return null;
  const mean = points.reduce((a, p) => a + p.value, 0) / points.length;
  const span = points[points.length - 1].slot - points[0].slot;
  const rel = mean === 0 ? 0 : (fit.slope * span) / Math.abs(mean);
  if (Math.abs(rel) < FLAT_BELOW) return 'flat';
  return rel > 0 ? 'up' : 'down';
}

/**
 * The period on show and the one before it. Day: the latest training day and
 * the one before it, whatever lies between. Week, month, year: the calendar
 * period holding `now` and the one directly before it, each null when it has
 * no sets — an older period is never passed off as the previous one.
 */
export function comparePeriods(
  bs: readonly Bucket[],
  gran: Granularity,
  now: number,
): { current: Bucket | null; previous: Bucket | null } {
  if (gran === 'all') return { current: null, previous: null };
  if (gran === 'day') {
    return { current: bs[bs.length - 1] ?? null, previous: bs[bs.length - 2] ?? null };
  }
  const currentStart = bucketStart(now, gran);
  const previousStart = bucketStart(currentStart - 1, gran);
  return {
    current: bs.find((b) => b.start === currentStart) ?? null,
    previous: bs.find((b) => b.start === previousStart) ?? null,
  };
}

/**
 * Current minus previous in whole units, each side rounded first so the change
 * is the difference of the two figures that are printed. `toUnits` is the
 * display conversion for a kilogram value; null when either side is missing.
 */
export function periodChange(
  current: number | null,
  previous: number | null,
  toUnits: (n: number) => number = (n) => n,
): number | null {
  if (current === null || previous === null) return null;
  return Math.round(toUnits(current)) - Math.round(toUnits(previous));
}
