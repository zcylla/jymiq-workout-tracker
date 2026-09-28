import { dayKey } from './calendar.ts';

export interface Reading {
  measuredAt: number;
  weightKg: number;
}

export interface DailyWeight {
  day: string;
  at: number;
  weightKg: number;
}

export interface MonthSummary {
  year: number;
  month: number;
  count: number;
  averageKg: number;
  changeKg: number | null;
}

export const WINDOW_DAYS = 14;

/** Calendar-day stepping, so a DST change never shifts a day boundary by an hour. */
const shiftDays = (at: number, days: number): number => {
  const d = new Date(at);
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + days,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds(),
  ).getTime();
};

const startOfDay = (at: number, offsetDays = 0): number => {
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offsetDays).getTime();
};

const mean = (values: number[]): number => values.reduce((a, b) => a + b, 0) / values.length;

/** One value per local day — the latest reading wins — oldest first. */
export function dailyWeights(readings: readonly Reading[]): DailyWeight[] {
  const byDay = new Map<string, DailyWeight>();
  for (const r of readings) {
    const day = dayKey(r.measuredAt);
    const held = byDay.get(day);
    if (!held || r.measuredAt >= held.at) {
      byDay.set(day, { day, at: r.measuredAt, weightKg: r.weightKg });
    }
  }
  return [...byDay.values()].sort((a, b) => a.at - b.at);
}

export function latest(readings: readonly Reading[]): number | null {
  let best: Reading | null = null;
  for (const r of readings) if (!best || r.measuredAt >= best.measuredAt) best = r;
  return best ? best.weightKg : null;
}

/** Mean of the daily values with `at` in `[from, to)`. */
export function averageOver(days: readonly DailyWeight[], from: number, to: number): number | null {
  const inside = days.filter((d) => d.at >= from && d.at < to).map((d) => d.weightKg);
  return inside.length ? mean(inside) : null;
}

export function sevenDayAverage(days: readonly DailyWeight[], now: number): number | null {
  return averageOver(days, startOfDay(now, -6), now + 1);
}

/** A delta needs a previous value: null when either week has no readings. */
export function thirtyDayChange(days: readonly DailyWeight[], now: number): number | null {
  const current = sevenDayAverage(days, now);
  const before = sevenDayAverage(days, shiftDays(now, -30));
  return current === null || before === null ? null : current - before;
}

/** The 14-day chart's maths: points only for days with a reading. */
export function trendGeometry(
  days: readonly DailyWeight[],
  now: number,
  w: number,
  h: number,
): { points: { x: number; y: number }[]; meanY: number; windowStart: number } {
  const windowStart = startOfDay(now, -(WINDOW_DAYS - 1));
  const index = new Map<string, number>();
  for (let i = 0; i < WINDOW_DAYS; i++)
    index.set(dayKey(startOfDay(now, i - (WINDOW_DAYS - 1))), i);

  const inside = days
    .map((d) => ({ i: index.get(d.day), v: d.weightKg }))
    .filter((p): p is { i: number; v: number } => p.i !== undefined);
  if (!inside.length) return { points: [], meanY: 0, windowStart };

  const values = inside.map((p) => p.v);
  const lo = Math.min(...values) - 0.4;
  const hi = Math.max(...values) + 0.4;
  const yOf = (v: number) => h - (h * (v - lo)) / (hi - lo);

  return {
    points: inside.map((p) => ({ x: (w * p.i) / (WINDOW_DAYS - 1), y: yOf(p.v) })),
    meanY: yOf(mean(values)),
    windowStart,
  };
}

/** Newest month first; change is against the previous month that has readings. */
export function byMonth(days: readonly DailyWeight[]): MonthSummary[] {
  const groups = new Map<string, { year: number; month: number; values: number[] }>();
  for (const d of [...days].sort((a, b) => a.at - b.at)) {
    const date = new Date(d.at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const g = groups.get(key) ?? { year: date.getFullYear(), month: date.getMonth(), values: [] };
    g.values.push(d.weightKg);
    groups.set(key, g);
  }

  const oldestFirst = [...groups.values()];
  return oldestFirst
    .map((g, i) => ({
      year: g.year,
      month: g.month,
      count: g.values.length,
      averageKg: mean(g.values),
      changeKg: i === 0 ? null : mean(g.values) - mean(oldestFirst[i - 1].values),
    }))
    .reverse();
}

/** Whole local days from `at` to `now`; 0 is today. */
export function daysSince(at: number, now: number): number {
  return Math.round((startOfDay(now) - startOfDay(at)) / 86_400_000);
}
