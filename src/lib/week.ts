import { type TrainedDay, dayKey } from './calendar.ts';

/**
 * The week strip on Today (Lab 45 W3), as arithmetic.
 *
 * Three whole Monday-first weeks ending on the Sunday of the current one —
 * §0 bounds the strip to two weeks back, and whole weeks are what let the
 * M T W T F S S rhythm survive scrolling. Scrolling is also why the date is on
 * the cell at all: a row of weekday letters cannot say *which* Tuesday once it
 * moves.
 *
 * **There is no missed state**, for the same reason the calendar has none: a
 * lapse needs to know which days you were supposed to train, and nothing stores
 * a plan by weekday until programs are built. Every untrained past day is rest.
 * Asserting a lapse the app cannot know about would be worse than not drawing one.
 */

export type DayState = 'done' | 'today' | 'rest' | 'ahead';

export interface StripDay {
  key: string;
  /** One character. Sunday is 'S' and so is Saturday — the position disambiguates. */
  letter: string;
  date: string;
  state: DayState;
  volumeKg: number;
  /** The session the cell opens. Null unless `state` is 'done'. */
  sessionId: string | null;
}

export interface WeekStrip {
  days: StripDay[];
  /** Local ms bounds of the strip, `[from, to)` — the query's range. */
  from: number;
  to: number;
  /** Where to rest the scroll. */
  todayIndex: number;
  /** The clock this strip was built against — the header's date comes from here
   *  rather than from a second `Date.now()` the screen would have to read
   *  during render. */
  todayAt: number;
  /**
   * The tallest bar in view. §0 makes the fill a *relative* scale — tallest bar
   * is the best day in view — which is why the tonnage stays printed underneath.
   */
  maxVolumeKg: number;
  /** This week's totals, and last week's, for the tiles under the strip. */
  thisWeek: WeekTotals;
  lastWeek: WeekTotals;
}

export interface WeekTotals {
  sessions: number;
  volumeKg: number;
}

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Monday-first weekday index: Mon 0 … Sun 6. */
const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

/** Weeks back from the current one that the strip reaches. §0 caps it at two. */
const WEEKS_BACK = 2;
const SPAN = (WEEKS_BACK + 1) * 7;

export function weekStrip(
  trained: ReadonlyMap<string, TrainedDay>,
  at: number | Date = Date.now(),
): WeekStrip {
  const now = at instanceof Date ? at : new Date(at);
  const todayKey = dayKey(now);

  // Midnight of the Monday two weeks before this one. Day-of-month overflow is
  // what Date normalises for us, so this costs no month or year arithmetic.
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - mondayIndex(now) - WEEKS_BACK * 7,
  );

  const days: StripDay[] = [];
  let todayIndex = 0;
  let maxVolumeKg = 0;

  for (let i = 0; i < SPAN; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = dayKey(d);
    const day = trained.get(key);
    const isToday = key === todayKey;
    if (isToday) todayIndex = i;

    // "today" outranks "done": the cell's job is to say where you are, and a
    // today you have already trained keeps its session through `sessionId`.
    const state: DayState = isToday ? 'today' : day ? 'done' : key > todayKey ? 'ahead' : 'rest';

    const volumeKg = day?.volumeKg ?? 0;
    if (volumeKg > maxVolumeKg) maxVolumeKg = volumeKg;

    days.push({
      key,
      letter: LETTERS[i % 7] as string,
      date: String(d.getDate()),
      state,
      volumeKg,
      sessionId: day?.sessionId ?? null,
    });
  }

  const totals = (from: number): WeekTotals => {
    let sessions = 0;
    let volumeKg = 0;
    for (let i = from; i < from + 7; i += 1) {
      const day = trained.get(days[i]?.key ?? '');
      if (!day) continue;
      sessions += day.count;
      volumeKg += day.volumeKg;
    }
    return { sessions, volumeKg };
  };

  return {
    days,
    from: start.getTime(),
    to: new Date(start.getFullYear(), start.getMonth(), start.getDate() + SPAN).getTime(),
    todayIndex,
    todayAt: now.getTime(),
    maxVolumeKg,
    thisWeek: totals(WEEKS_BACK * 7),
    lastWeek: totals((WEEKS_BACK - 1) * 7),
  };
}
