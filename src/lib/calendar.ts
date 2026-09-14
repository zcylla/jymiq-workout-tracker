/**
 * The month grid, as arithmetic (Lab 39 Q2).
 *
 * Always whole weeks, Monday first, with the adjacent-month days present and
 * flagged rather than omitted — an omitted leading cell reads as a bug, which
 * is what the first version of that board did.
 */

export type IntensityStep = 1 | 2 | 3;

export interface MonthCell {
  /** `YYYY-MM-DD` in local time — the key a session's timestamp joins on. */
  key: string;
  /** Day of its own month, 1-31. */
  day: number;
  /** Belongs to the month either side: drawn dim, and never a target. */
  adjacent: boolean;
}

export interface MonthGrid {
  /** Local ms bounds of the month itself, `[from, to)` — the query's range. */
  from: number;
  to: number;
  /** The screen title: the month's own name. */
  title: string;
  /** Days in the month — the denominator of "trained N of M". */
  days: number;
  todayKey: string;
  weeks: MonthCell[][];
}

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

const asDate = (at: number | Date) => (at instanceof Date ? at : new Date(at));

/**
 * `YYYY-MM-DD` in local time. A session belongs to the day you started it on
 * the wall clock, not to a UTC date that flips mid-evening.
 */
export function dayKey(at: number | Date): string {
  const d = asDate(at);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday-first weekday index: Mon 0 … Sun 6. The board's heads are M T W T F S S. */
const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

export function monthGrid(at: number | Date = Date.now()): MonthGrid {
  const now = asDate(at);
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();

  const lead = mondayIndex(first);
  const weeks: MonthCell[][] = [];
  for (let w = 0; w < Math.ceil((lead + days) / 7); w += 1) {
    const week: MonthCell[] = [];
    for (let i = 0; i < 7; i += 1) {
      // Day-of-month overflow is what Date normalises for us, so the leading
      // and trailing cells cost no month or year arithmetic of their own.
      const d = new Date(year, month, 1 - lead + w * 7 + i);
      week.push({ key: dayKey(d), day: d.getDate(), adjacent: d.getMonth() !== month });
    }
    weeks.push(week);
  }

  return {
    from: first.getTime(),
    to: new Date(year, month + 1, 1).getTime(),
    title: first.toLocaleDateString('en-US', { month: 'long' }),
    days,
    todayKey: dayKey(now),
    weeks,
  };
}

/** One logged session, as much of it as a calendar cell needs. */
export interface DaySession {
  id: string;
  startedAt: number;
  totalVolumeKg: number | null;
}

export interface TrainedDay {
  step: IntensityStep;
  /** The session the cell opens — the last one started that day. */
  sessionId: string;
  startedAt: number;
  /** The day's tonnage, summed over every session on it. */
  volumeKg: number;
  count: number;
}

/**
 * Three steps and no more (§0) — past four, adjacent alphas stop being
 * distinguishable at this cell size.
 *
 * The scale is relative to the month's own hardest day, the same rule the week
 * strip uses ("tallest bar is the best day in view"). An absolute tonnage
 * threshold would need a number nobody has set and would go wrong the first
 * time a programme changes. The cost is that two months are not comparable
 * cell-for-cell, which is what the printed summary line is for.
 */
export function intensityStep(volumeKg: number, maxVolumeKg: number): IntensityStep {
  if (maxVolumeKg <= 0) return 1;
  const ratio = volumeKg / maxVolumeKg;
  if (ratio >= 2 / 3) return 3;
  if (ratio >= 1 / 3) return 2;
  return 1;
}

/**
 * Sessions bucketed into the cells that draw them.
 *
 * A cell is a *day*, not a session: two sessions on one date are one cell
 * carrying their summed tonnage, and tapping it opens the last one started —
 * newest-first is the order every other list in the app already uses.
 *
 * A session with no recorded volume (abandoned before a set was logged) still
 * counts as trained and lands on the bottom step; it happened, so an empty
 * cell would be a lie.
 */
export function trainedDays(rows: readonly DaySession[]): Map<string, TrainedDay> {
  type Acc = Omit<TrainedDay, 'step'>;
  const acc = new Map<string, Acc>();

  for (const row of rows) {
    const key = dayKey(row.startedAt);
    const prev = acc.get(key);
    const keepPrev = prev !== undefined && prev.startedAt > row.startedAt;
    acc.set(key, {
      sessionId: keepPrev ? prev.sessionId : row.id,
      startedAt: keepPrev ? prev.startedAt : row.startedAt,
      volumeKg: (prev?.volumeKg ?? 0) + (row.totalVolumeKg ?? 0),
      count: (prev?.count ?? 0) + 1,
    });
  }

  let max = 0;
  for (const day of acc.values()) if (day.volumeKg > max) max = day.volumeKg;

  const out = new Map<string, TrainedDay>();
  for (const [key, day] of acc) out.set(key, { ...day, step: intensityStep(day.volumeKg, max) });
  return out;
}
