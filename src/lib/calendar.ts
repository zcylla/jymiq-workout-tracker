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
  year: number;
  /** Local ms bounds of the whole weeks the grid draws, `[from, to)`. A week's
   *  total needs its adjacent-month days, so this is the range to query. */
  gridFrom: number;
  gridTo: number;
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

/**
 * Monday-first weekday index: Mon 0 … Sun 6. The board's heads are M T W T F S S.
 * Exported because the week strip and the program schedule index off the same
 * seven positions, and three private copies of this is how they drift apart.
 */
export const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

/**
 * `today` is separate from `at` so a month other than the current one still
 * knows which day is today; it defaults to `at`.
 */
export function monthGrid(at: number | Date = Date.now(), today: number | Date = at): MonthGrid {
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
    year,
    gridFrom: new Date(year, month, 1 - lead).getTime(),
    gridTo: new Date(year, month, 1 - lead + weeks.length * 7).getTime(),
    days,
    todayKey: dayKey(today),
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

/** ISO 8601 week number: the week containing the year's first Thursday is week 1. */
export function isoWeek(d: Date): number {
  const thursday = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + 3 - mondayIndex(d));
  const jan1 = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1);
  return 1 + Math.floor((thursday - jan1) / (7 * 86_400_000));
}

export interface WeekVolume {
  /** `W36`. */
  label: string;
  volumeKg: number;
}

/**
 * Tonnage per Monday-first week the grid draws, oldest first.
 *
 * `trained` must cover `gridFrom`..`gridTo`, or the first and last weeks come
 * out short. A week that has not started yet is dropped rather than drawn as
 * zero — nothing has been lifted in it, and a zero column reads as a lapse.
 */
export function weekVolumes(
  grid: MonthGrid,
  trained: ReadonlyMap<string, TrainedDay>,
): WeekVolume[] {
  const out: WeekVolume[] = [];
  for (const week of grid.weeks) {
    const monday = week[0];
    if (!monday || monday.key > grid.todayKey) continue;
    let volumeKg = 0;
    for (const cell of week) volumeKg += trained.get(cell.key)?.volumeKg ?? 0;
    const [y, m, d] = monday.key.split('-').map(Number) as [number, number, number];
    out.push({ label: `W${isoWeek(new Date(y, m - 1, d))}`, volumeKg });
  }
  return out;
}

export function yearsWithSessions(startedAtMs: readonly number[], now: number): number[] {
  const years = new Set<number>();
  for (const at of startedAtMs) {
    if (!Number.isFinite(at) || at <= 0 || at > now) continue;
    const year = new Date(at).getFullYear();
    if (Number.isFinite(year)) years.add(year);
  }
  return [...years].sort((a, b) => b - a);
}

export function monthsBackForYear(year: number, displayedMonth: number, now: number): number {
  const today = new Date(now);
  return Math.max(0, (today.getFullYear() - year) * 12 + today.getMonth() - displayedMonth);
}
