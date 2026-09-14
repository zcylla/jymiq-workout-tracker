import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type DaySession, dayKey, intensityStep, monthGrid, trainedDays } from './calendar.ts';

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
