import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  NO_SCHEDULE,
  type Schedule,
  isMissed,
  nextScheduled,
  programWeek,
  programWeekNumber,
  upcomingScheduled,
} from './program.ts';

/** Thursday 17 September 2026, local. */
const THU = new Date(2026, 8, 17, 10, 0);

type R = { id: string; name: string };
const r = (id: string): R => ({ id, name: id });

/** Mon Lower A · Thu Lower B · Fri Upper B, running since Monday 14 Sep. */
const PPL: Schedule<R> = {
  days: new Map([
    [0, r('lower-a')],
    [3, r('lower-b')],
    [4, r('upper-b')],
  ]),
  since: '2026-09-14',
};

// ------------------------------------------------------------------ missed --
test('a past scheduled day with no session is missed', () => {
  assert.equal(isMissed(PPL, '2026-09-14', 0, false, '2026-09-17'), true);
});

test('a past day with no routine on it is rest, not missed', () => {
  assert.equal(isMissed(PPL, '2026-09-15', 1, false, '2026-09-17'), false);
});

test('a day you trained is never missed', () => {
  assert.equal(isMissed(PPL, '2026-09-14', 0, true, '2026-09-17'), false);
});

test('today is never missed — the day is not over', () => {
  assert.equal(isMissed(PPL, '2026-09-17', 3, false, '2026-09-17'), false);
});

test('nothing before the day the program started is missed', () => {
  // The Monday a week before it was activated.
  assert.equal(isMissed(PPL, '2026-09-07', 0, false, '2026-09-17'), false);
});

test('a program that has never run makes no day missed', () => {
  const paused: Schedule<R> = { days: PPL.days, since: null };
  assert.equal(isMissed(paused, '2026-09-14', 0, false, '2026-09-17'), false);
});

test('with no program running nothing is missed', () => {
  assert.equal(isMissed(NO_SCHEDULE, '2026-09-14', 0, false, '2026-09-17'), false);
});

// ---------------------------------------------------------------- upcoming --
test('today counts as upcoming when it is scheduled', () => {
  const next = nextScheduled(PPL, THU);
  assert.equal(next?.routine.id, 'lower-b');
  assert.equal(next?.daysAway, 0);
  assert.equal(next?.key, '2026-09-17');
});

test('an unscheduled today looks forward to the next one', () => {
  const wed = new Date(2026, 8, 16, 10, 0);
  const next = nextScheduled(PPL, wed);
  assert.equal(next?.routine.id, 'lower-b');
  assert.equal(next?.daysAway, 1);
});

test('the next three are three dates, not three weekdays', () => {
  const up = upcomingScheduled(PPL, 3, THU);
  assert.deepEqual(
    up.map((d) => [d.key, d.routine.id, d.daysAway]),
    [
      ['2026-09-17', 'lower-b', 0],
      ['2026-09-18', 'upper-b', 1],
      ['2026-09-21', 'lower-a', 4],
    ],
  );
});

test('upcoming carries the local midnight of its day', () => {
  const [first] = upcomingScheduled(PPL, 1, THU);
  assert.equal(first?.at, new Date(2026, 8, 17).getTime());
});

test('an empty schedule has no next and does not spin', () => {
  assert.equal(nextScheduled(NO_SCHEDULE, THU), null);
  assert.deepEqual(upcomingScheduled(NO_SCHEDULE, 3, THU), []);
});

// ------------------------------------------------------------- the strip ----
test('the week is seven Monday-first cells for the current week', () => {
  const week = programWeek(PPL, new Set(), THU);
  assert.equal(week.length, 7);
  assert.deepEqual(
    week.map((d) => d.label),
    ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  );
  assert.equal(week[0]?.key, '2026-09-14');
  assert.equal(week[6]?.key, '2026-09-20');
});

test('the strip tells done, today, missed, rest and ahead apart', () => {
  const week = programWeek(PPL, new Set(['2026-09-14']), THU);
  assert.deepEqual(
    week.map((d) => d.state),
    ['done', 'rest', 'rest', 'today', 'ahead', 'rest', 'rest'],
  );
});

test('a skipped scheduled day earlier in the week reads as missed', () => {
  const week = programWeek(PPL, new Set(), THU);
  assert.equal(week[0]?.state, 'missed');
});

test('a rest day carries no routine', () => {
  const week = programWeek(PPL, new Set(), THU);
  assert.equal(week[1]?.routine, null);
  assert.equal(week[3]?.routine?.id, 'lower-b');
});

// ------------------------------------------------------------ week number ---
test('the week number counts from the Monday of the week it started', () => {
  const started = new Date(2026, 8, 17).getTime(); // a Thursday
  assert.equal(programWeekNumber(started, new Date(2026, 8, 19)), 1); // same week
  assert.equal(programWeekNumber(started, new Date(2026, 8, 21)), 2); // next Monday
  assert.equal(programWeekNumber(started, new Date(2026, 9, 5)), 4);
});

test('a program that has never run has no week number to report', () => {
  assert.equal(programWeekNumber(null, THU), null);
});

test('a clock behind the start date reads as week one, never as zero', () => {
  const started = new Date(2026, 8, 21).getTime();
  assert.equal(programWeekNumber(started, new Date(2026, 8, 17)), 1);
});
