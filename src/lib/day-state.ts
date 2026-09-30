import { type Schedule, isMissed } from './program.ts';

/**
 * One grammar for the calendar and the week strip (Lab 49 D1): solid is done,
 * dashed is planned, hatched is missed, nothing is rest. Today is not a mark of
 * its own — it is a flag on top of one, so a today you trained and a today you
 * still owe are both readable.
 */
export type DayMark = 'done' | 'planned' | 'missed' | 'rest';

export interface DayState {
  mark: DayMark;
  today: boolean;
}

/**
 * `weekday` is Monday-first, 0-6 — the position in a Monday-first week, which is
 * also what the schedule is keyed by.
 *
 * Planned needs a program that has started: with nothing running there is no
 * plan, so the answer is rest, never a dashed outline the app would be
 * inventing. Nothing is planned before the day the program started either,
 * which is what `since` already guards for missed.
 */
export function dayState(
  schedule: Schedule,
  key: string,
  weekday: number,
  trained: boolean,
  todayKey: string,
): DayState {
  const today = key === todayKey;
  if (trained) return { mark: 'done', today };
  if (key >= todayKey) {
    const planned = schedule.since !== null && schedule.days.has(weekday);
    return { mark: planned ? 'planned' : 'rest', today };
  }
  return { mark: isMissed(schedule, key, weekday, false, todayKey) ? 'missed' : 'rest', today };
}
