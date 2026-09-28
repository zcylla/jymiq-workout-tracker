import { dayKey, mondayIndex } from './calendar.ts';

/**
 * A program, as arithmetic (Lab 34 A3/A4).
 *
 * A program is a weekly shape: seven weekday slots, each either a routine or
 * rest. §0's feature list also names a fixed cycle; nothing here stores one —
 * a cycle needs a length, a start and a position, and none of those has a
 * screen. Weekday-only is the whole model, and the build log records why.
 *
 * **`since` is what keeps the missed state honest.** A program activated on
 * Thursday cannot make the Mondays before it into lapses, so nothing earlier
 * than the day it started is ever missed.
 */

export const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export interface Schedule<T = unknown> {
  /** Monday-first weekday (0–6) → the routine planned for it. Absent is rest. */
  days: ReadonlyMap<number, T>;
  /** `dayKey` of the day the program started. Null when it has never run. */
  since: string | null;
}

export const NO_SCHEDULE: Schedule<never> = { days: new Map<number, never>(), since: null };

/**
 * A day you were supposed to train and did not.
 *
 * Today is never missed — the day is not over. A day with no routine on it is
 * rest, which is a different thing and §0 requires it to look different.
 */
export function isMissed<T>(
  schedule: Schedule<T>,
  key: string,
  weekday: number,
  trained: boolean,
  todayKey: string,
): boolean {
  if (trained || schedule.since === null) return false;
  // Keys are zero-padded `YYYY-MM-DD`, so a string compare is a date compare.
  return key >= schedule.since && key < todayKey && schedule.days.has(weekday);
}

export interface ScheduledDay<T> {
  weekday: number;
  label: string;
  routine: T;
  /** 0 is today. */
  daysAway: number;
  key: string;
  /** Local midnight of that day, for anything that has to print a date. */
  at: number;
}

/**
 * The next `count` days carrying a routine, today first.
 *
 * Walks forward a bounded number of days rather than doing modular arithmetic
 * on the weekday, because that is what makes "three in a row on the same
 * weekday" come out as three separate dates rather than one repeated cell.
 */
export function upcomingScheduled<T>(
  schedule: Schedule<T>,
  count: number,
  at: number | Date = Date.now(),
): ScheduledDay<T>[] {
  const out: ScheduledDay<T>[] = [];
  if (schedule.days.size === 0 || count <= 0) return out;

  const now = at instanceof Date ? at : new Date(at);
  // Four weeks is enough for any weekday schedule to repeat; the cap is what
  // stops an empty schedule from spinning, and `days.size === 0` above is the
  // only way it can be empty.
  for (let i = 0; i < 28 && out.length < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const weekday = mondayIndex(d);
    const routine = schedule.days.get(weekday);
    if (routine === undefined) continue;
    out.push({
      weekday,
      label: WEEKDAY_LABELS[weekday] as string,
      routine,
      daysAway: i,
      key: dayKey(d),
      at: d.getTime(),
    });
  }
  return out;
}

export function nextScheduled<T>(
  schedule: Schedule<T>,
  at: number | Date = Date.now(),
): ScheduledDay<T> | null {
  return upcomingScheduled(schedule, 1, at)[0] ?? null;
}

export type ProgramDayState = 'done' | 'today' | 'missed' | 'rest' | 'ahead';

export interface ProgramWeekDay<T> {
  weekday: number;
  label: string;
  /** Null is rest — the slot has no routine on it. */
  routine: T | null;
  state: ProgramDayState;
  key: string;
}

/**
 * The seven cells of A3's day strip: this week, Monday first.
 *
 * "today" outranks everything, the same rule the week strip uses — the cell's
 * job is to say where you are in the week.
 */
export function programWeek<T>(
  schedule: Schedule<T>,
  trained: ReadonlySet<string>,
  at: number | Date = Date.now(),
): ProgramWeekDay<T>[] {
  const now = at instanceof Date ? at : new Date(at);
  const todayKey = dayKey(now);
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayIndex(now));

  const out: ProgramWeekDay<T>[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = dayKey(d);
    const routine = schedule.days.get(i) ?? null;
    const done = trained.has(key);

    const state: ProgramDayState =
      key === todayKey
        ? 'today'
        : done
          ? 'done'
          : isMissed(schedule, key, i, done, todayKey)
            ? 'missed'
            : key > todayKey && routine !== null
              ? 'ahead'
              : 'rest';

    out.push({ weekday: i, label: WEEKDAY_LABELS[i] as string, routine, state, key });
  }
  return out;
}

/**
 * Which week of the program this is, 1-based, counted from the Monday of the
 * week it started — a program started on a Thursday is still in week 1 on the
 * Saturday, and rolls to week 2 on the Monday.
 *
 * Null when it has never run, because "week 1" of a program you have not
 * started is a number the app would be inventing.
 */
export function programWeekNumber(
  startedAt: number | null,
  at: number | Date = Date.now(),
): number | null {
  if (startedAt === null) return null;
  const now = at instanceof Date ? at : new Date(at);
  const start = new Date(startedAt);
  const startMonday = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() - mondayIndex(start),
  );
  const nowMonday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - mondayIndex(now));
  // UTC midnights of two local dates: the difference is whole days either way,
  // so a DST shift inside the span cannot round the division.
  const weeks = Math.floor((nowMonday - startMonday) / (7 * 86_400_000));
  return weeks < 0 ? 1 : weeks + 1;
}

/**
 * Trained days per program week, week 1 first, through the week `at` falls in.
 * A day counts once however many sessions it holds, and a session before
 * `startedAt` predates the program even when it shares week 1.
 */
export function trainedDaysPerWeek(
  startedAt: number,
  sessionStarts: readonly number[],
  at: number | Date = Date.now(),
): number[] {
  const atMs = at instanceof Date ? at.getTime() : at;
  const weeks = programWeekNumber(startedAt, atMs) ?? 1;
  const days: Set<string>[] = Array.from({ length: weeks }, () => new Set());
  for (const s of sessionStarts) {
    if (s < startedAt || s > atMs) continue;
    days[(programWeekNumber(startedAt, s) ?? 1) - 1]?.add(dayKey(s));
  }
  return days.map((d) => d.size);
}
