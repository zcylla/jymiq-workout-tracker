import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  type DaySession,
  dayKey,
  intensityStep,
  isoWeek,
  monthGrid,
  monthsBackForYear,
  trainedDays,
  weekVolumes,
  yearsWithSessions,
} from './calendar.ts';

/** September 2026 starts on a Tuesday — lab39.py's own month. */
const SEPT = new Date(2026, 8, 6, 12, 0, 0);

test('monthGrid is whole Monday-first weeks, never a ragged row', () => {
  const grid = monthGrid(SEPT);
  assert.equal(grid.weeks.length, 5);
  for (const week of grid.weeks) assert.equal(week.length, 7);
  assert.equal(grid.weeks.flat().length, 35);
});

test('monthGrid dims the adjacent-month days rather than omitting them', () => {
  const grid = monthGrid(SEPT);
  const [first] = grid.weeks;
  assert.deepEqual(first?.[0], { key: '2026-08-31', day: 31, adjacent: true });
  assert.deepEqual(first?.[1], { key: '2026-09-01', day: 1, adjacent: false });

  const trail = grid.weeks
    .at(-1)
    ?.filter((c) => c.adjacent)
    .map((c) => c.day);
  assert.deepEqual(trail, [1, 2, 3, 4]);
  assert.equal(grid.weeks.flat().filter((c) => !c.adjacent).length, 30);
});

test('monthGrid bounds the month itself, not the grid', () => {
  const grid = monthGrid(SEPT);
  assert.equal(grid.from, new Date(2026, 8, 1).getTime());
  assert.equal(grid.to, new Date(2026, 9, 1).getTime());
  assert.equal(grid.days, 30);
  assert.equal(grid.title, 'September');
  assert.equal(grid.todayKey, '2026-09-06');
});

test('monthGrid crosses a year boundary', () => {
  const jan = monthGrid(new Date(2027, 0, 15));
  assert.equal(jan.weeks[0]?.[0]?.key, '2026-12-28');
  assert.equal(jan.weeks.at(-1)?.at(-1)?.key, '2027-01-31');
});

test('dayKey is the local calendar day, so a late session stays on its own date', () => {
  assert.equal(dayKey(new Date(2026, 8, 6, 23, 30)), '2026-09-06');
  assert.equal(dayKey(new Date(2026, 0, 1, 0, 5).getTime()), '2026-01-01');
});

test('intensityStep has exactly three steps, topped out at the month best', () => {
  assert.equal(intensityStep(100, 100), 3);
  assert.equal(intensityStep(67, 100), 3);
  assert.equal(intensityStep(66, 100), 2);
  assert.equal(intensityStep(34, 100), 2);
  assert.equal(intensityStep(33, 100), 1);
  assert.equal(intensityStep(0, 100), 1);
  // No trained day has volume: everything sits on the bottom step, never NaN.
  assert.equal(intensityStep(0, 0), 1);
});

const at = (day: number, hour = 9) => new Date(2026, 8, day, hour).getTime();

test('trainedDays scales the steps against the month own hardest day', () => {
  const rows: DaySession[] = [
    { id: 'a', startedAt: at(1), totalVolumeKg: 1000 },
    { id: 'b', startedAt: at(3), totalVolumeKg: 500 },
    { id: 'c', startedAt: at(5), totalVolumeKg: 200 },
  ];
  const days = trainedDays(rows);
  assert.equal(days.size, 3);
  assert.equal(days.get('2026-09-01')?.step, 3);
  assert.equal(days.get('2026-09-03')?.step, 2);
  assert.equal(days.get('2026-09-05')?.step, 1);
});

test('trainedDays folds two sessions on one date into one cell', () => {
  const rows: DaySession[] = [
    { id: 'morning', startedAt: at(9, 7), totalVolumeKg: 400 },
    { id: 'evening', startedAt: at(9, 19), totalVolumeKg: 600 },
    { id: 'other', startedAt: at(11), totalVolumeKg: 500 },
  ];
  const day = trainedDays(rows).get('2026-09-09');
  assert.equal(day?.count, 2);
  assert.equal(day?.volumeKg, 1000);
  // The last one started is the one the cell opens.
  assert.equal(day?.sessionId, 'evening');
  assert.equal(day?.step, 3);
});

test('trainedDays keeps a session that logged no volume', () => {
  const days = trainedDays([
    { id: 'a', startedAt: at(2), totalVolumeKg: null },
    { id: 'b', startedAt: at(4), totalVolumeKg: 800 },
  ]);
  assert.equal(days.get('2026-09-02')?.step, 1);
  assert.equal(days.get('2026-09-02')?.volumeKg, 0);
});

test('trainedDays on an empty month is empty, not a grid of zeroes', () => {
  assert.equal(trainedDays([]).size, 0);
});

test('monthGrid takes today separately, so another month still knows which day is today', () => {
  const aug = monthGrid(new Date(2026, 7, 1), SEPT);
  assert.equal(aug.title, 'August');
  assert.equal(aug.year, 2026);
  assert.equal(aug.todayKey, '2026-09-06');
});

test('monthGrid reports the whole weeks it draws as a query range', () => {
  const grid = monthGrid(SEPT);
  assert.equal(grid.gridFrom, new Date(2026, 7, 31).getTime());
  assert.equal(grid.gridTo, new Date(2026, 9, 5).getTime());
});

test('isoWeek follows ISO 8601 across a year boundary', () => {
  assert.equal(isoWeek(new Date(2026, 8, 28)), 40);
  assert.equal(isoWeek(new Date(2026, 8, 27)), 39);
  assert.equal(isoWeek(new Date(2026, 0, 1)), 1);
  assert.equal(isoWeek(new Date(2027, 0, 1)), 53);
});

test('weekVolumes sums whole weeks, including the days the neighbouring month owns', () => {
  const grid = monthGrid(SEPT);
  const trained = trainedDays([
    { id: 'aug31', startedAt: at(1) - 86_400_000, totalVolumeKg: 1000 },
    { id: 'a', startedAt: at(1), totalVolumeKg: 2000 },
    { id: 'b', startedAt: at(2), totalVolumeKg: 500 },
  ]);
  const weeks = weekVolumes(grid, trained);
  assert.equal(weeks[0]?.label, 'W36');
  assert.equal(weeks[0]?.volumeKg, 3500);
});

test('weekVolumes drops a week that has not started, and keeps the one under way', () => {
  const grid = monthGrid(SEPT);
  // 2026-09-06 is a Sunday: weeks starting Aug 31 and Sep 7 onwards; only the first has begun.
  const weeks = weekVolumes(grid, new Map());
  assert.equal(weeks.length, 1);
  assert.equal(weeks[0]?.volumeKg, 0);
});

test('weekVolumes covers every week of a month already over', () => {
  const grid = monthGrid(new Date(2026, 7, 1), SEPT);
  assert.equal(weekVolumes(grid, new Map()).length, grid.weeks.length);
});

test('yearsWithSessions returns no years for no sessions', () => {
  assert.deepEqual(yearsWithSessions([], SEPT.getTime()), []);
});

test('yearsWithSessions offers one year once', () => {
  assert.deepEqual(yearsWithSessions([at(1), at(2), at(1)], SEPT.getTime()), [2026]);
});

test('yearsWithSessions sorts unsorted years newest first and removes duplicates', () => {
  const timestamps = [2024, 2026, 2025, 2024, 2025].map((year) => new Date(year, 0, 1).getTime());
  assert.deepEqual(yearsWithSessions(timestamps, SEPT.getTime()), [2026, 2025, 2024]);
});

test('yearsWithSessions buckets both sides of local New Year midnight', () => {
  const december = new Date(2025, 11, 31, 23, 30).getTime();
  const january = new Date(2026, 0, 1, 0, 5).getTime();
  assert.deepEqual(yearsWithSessions([december], SEPT.getTime()), [2025]);
  assert.deepEqual(yearsWithSessions([december, january], SEPT.getTime()), [2026, 2025]);
});

test('yearsWithSessions ignores future, non-finite, and non-positive timestamps', () => {
  assert.deepEqual(
    yearsWithSessions(
      [
        NaN,
        Infinity,
        -Infinity,
        -1,
        0,
        8.64e15 + 1,
        at(7),
        new Date(2027, 0, 1).getTime(),
        at(1),
        SEPT.getTime(),
      ],
      SEPT.getTime(),
    ),
    [2026],
  );
});

test('monthsBackForYear keeps March when jumping from 2026 to 2025', () => {
  const now = new Date(2026, 2, 15).getTime();
  const back = monthsBackForYear(2025, 2, now);
  assert.equal(back, 12);
  assert.equal(monthGrid(new Date(2026, 2 - back, 1), now).from, new Date(2025, 2, 1).getTime());
});

test('monthsBackForYear handles a past month in the current year', () => {
  assert.equal(monthsBackForYear(2026, 2, SEPT.getTime()), 6);
  assert.equal(monthsBackForYear(2026, 8, SEPT.getTime()), 0);
});

test('monthsBackForYear clamps a later month of the current year to now', () => {
  const back = monthsBackForYear(2026, 11, SEPT.getTime());
  assert.equal(back, 0);
  assert.equal(monthGrid(new Date(2026, 8 - back, 1), SEPT).title, 'September');
});

test('monthsBackForYear handles January and December edges', () => {
  assert.equal(monthsBackForYear(2025, 11, new Date(2026, 0, 15).getTime()), 1);
  assert.equal(monthsBackForYear(2025, 0, new Date(2026, 11, 15).getTime()), 23);
  assert.equal(monthsBackForYear(2026, 0, new Date(2026, 0, 15).getTime()), 0);
});
