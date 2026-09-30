import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  SESSION_DURATION_CEILING_SEC,
  dateLabel,
  dayLabel,
  formatTotalTime,
  isPlausibleDuration,
  monthTime,
  sessionDateLabel,
} from './time.ts';
import { monthGrid } from './calendar.ts';

test('the Today header says which day it is, even when that day is today', () => {
  const sun = Date.UTC(2026, 8, 13, 12, 0);
  // sessionDateLabel collapses to "Today", which is exactly what a header must not do.
  assert.equal(sessionDateLabel(sun, { now: sun }), 'Today');
  assert.match(dateLabel(sun), /^\w{3} \d{1,2} \w{3}$/);
  assert.doesNotMatch(dateLabel(sun), /Today/);
});

test('a duration that cannot be true is rejected at both ends', () => {
  assert.equal(isPlausibleDuration(null), false);
  assert.equal(isPlausibleDuration(0), false); // a stored zero never happened
  assert.equal(isPlausibleDuration(-1), false);
  assert.equal(isPlausibleDuration(3600), true);
  assert.equal(isPlausibleDuration(SESSION_DURATION_CEILING_SEC), true);
  // The session left open since 7 September, which printed "7364 MIN".
  assert.equal(isPlausibleDuration(7364 * 60), false);
});

test('a month row names the weekday and the day, and nothing else', () => {
  assert.equal(dayLabel(new Date(2026, 8, 29, 18, 30).getTime()), 'Tue 29');
  assert.equal(dayLabel(new Date(2026, 8, 1).getTime()), 'Tue 1');
});

const row = (durationSec: number | null) => ({ durationSec });

test('a month with nothing logged reads a dash for both, not a zero', () => {
  assert.deepEqual(monthTime([]), { total: '—', avg: '—' });
});

test('one session: the total and the average are the same span', () => {
  assert.deepEqual(monthTime([row(2520)]), { total: '42 M', avg: '42 MIN' });
});

test('under an hour is whole minutes, from an hour it is hours to one decimal', () => {
  assert.equal(formatTotalTime(2520), '42 M');
  assert.equal(formatTotalTime(3540), '59 M');
  assert.equal(formatTotalTime(3570), '1.0 H'); // 59.5 min rounds to 60, which is an hour
  assert.equal(formatTotalTime(3600), '1.0 H');
  assert.equal(formatTotalTime(61560), '17.1 H'); // 17 h 6 min
});

test('exactly 3600 s is one hour on both tiles', () => {
  assert.deepEqual(monthTime([row(3600)]), { total: '1.0 H', avg: '1H 00' });
});

test('a null, zero or impossible duration is out of the sum and out of the denominator', () => {
  // 3600 + 1800 over the two that count: 5400 s, average 2700 s. Counting all
  // five as sessions would have made it 1080 s, which is 18 MIN.
  const rows = [row(3600), row(null), row(1800), row(0), row(SESSION_DURATION_CEILING_SEC + 1)];
  assert.deepEqual(monthTime(rows), { total: '1.5 H', avg: '45 MIN' });
  assert.deepEqual(monthTime([row(null), row(0)]), { total: '—', avg: '—' });
});

test('a long month sums past ten hours, and the average stays a session', () => {
  // 15 sessions of 4140 s (1 h 9 min): 62100 s = 17.25 h, average 69 min.
  const rows = Array.from({ length: 15 }, () => row(4140));
  assert.deepEqual(monthTime(rows), { total: '17.3 H', avg: '1H 09' });
});

test('the month is bounded by the grid: its last millisecond is in, the next month is out', () => {
  const grid = monthGrid(new Date(2026, 8, 6, 12));
  const sessions = [
    { startedAt: grid.from - 1, durationSec: 7200 },
    { startedAt: grid.from, durationSec: 3600 },
    { startedAt: grid.to - 1, durationSec: 1800 },
    { startedAt: grid.to, durationSec: 7200 },
  ];
  const inMonth = sessions.filter((s) => s.startedAt >= grid.from && s.startedAt < grid.to);
  assert.deepEqual(monthTime(inMonth), { total: '1.5 H', avg: '45 MIN' });
});
