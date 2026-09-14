import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { TrainedDay } from './calendar.ts';
import { weekStrip } from './week.ts';

/** Thursday 4 September 2026, local. The board's own date. */
const THU = new Date(2026, 8, 4, 10, 0);

const day = (sessionId: string, volumeKg: number, count = 1): TrainedDay => ({
  step: 1,
  sessionId,
  startedAt: 0,
  volumeKg,
  count,
});

const none = new Map<string, TrainedDay>();

test('the strip is three whole Monday-first weeks ending on this Sunday', () => {
  const { days } = weekStrip(none, THU);
  assert.equal(days.length, 21);
  assert.equal(days[0]?.letter, 'M');
  assert.equal(days[20]?.letter, 'S');
  // Two Mondays back from the week containing Thu 4 Sep 2026 (Mon 31 Aug).
  assert.equal(days[0]?.key, '2026-08-17');
  assert.equal(days[20]?.key, '2026-09-06');
});

test('the query range spans exactly the days drawn', () => {
  const { from, to, days } = weekStrip(none, THU);
  assert.equal(new Date(from).getDate(), 17);
  // `to` is exclusive: the midnight after the last cell.
  assert.equal(new Date(to).getDate(), 7);
  assert.equal(days.length, Math.round((to - from) / 86_400_000));
});

test('past, present and future are three different states', () => {
  const { days, todayIndex } = weekStrip(none, THU);
  assert.equal(days[todayIndex]?.key, '2026-09-04');
  assert.equal(days[todayIndex]?.state, 'today');
  assert.equal(days[todayIndex - 1]?.state, 'rest');
  assert.equal(days[todayIndex + 1]?.state, 'ahead');
});

test('a trained past day is done and carries the session it opens', () => {
  const trained = new Map([['2026-09-01', day('s1', 6200)]]);
  const cell = weekStrip(trained, THU).days.find((d) => d.key === '2026-09-01');
  assert.equal(cell?.state, 'done');
  assert.equal(cell?.sessionId, 's1');
  assert.equal(cell?.volumeKg, 6200);
});

test('an untrained day is never a target', () => {
  for (const cell of weekStrip(none, THU).days) {
    assert.equal(cell.sessionId, null);
  }
});

test('today outranks done, but a trained today stays openable', () => {
  const trained = new Map([['2026-09-04', day('s9', 5000)]]);
  const { days, todayIndex } = weekStrip(trained, THU);
  // The cell's job is to say where you are; the session rides along.
  assert.equal(days[todayIndex]?.state, 'today');
  assert.equal(days[todayIndex]?.sessionId, 's9');
});

test('the fill scale is the best day in view, not an absolute tonnage', () => {
  const trained = new Map([
    ['2026-09-01', day('a', 6200)],
    ['2026-09-02', day('b', 8100)],
  ]);
  assert.equal(weekStrip(trained, THU).maxVolumeKg, 8100);
});

test('a strip with nothing in it has no scale, and must not divide by zero', () => {
  assert.equal(weekStrip(none, THU).maxVolumeKg, 0);
});

test('this week and last week are counted separately, for the delta', () => {
  const trained = new Map([
    ['2026-09-01', day('a', 6200)], // this week (Mon 31 Aug – Sun 6 Sep)
    ['2026-09-02', day('b', 5100)], // this week
    ['2026-08-26', day('c', 4800)], // last week
  ]);
  const { thisWeek, lastWeek } = weekStrip(trained, THU);
  assert.deepEqual(thisWeek, { sessions: 2, volumeKg: 11_300 });
  assert.deepEqual(lastWeek, { sessions: 1, volumeKg: 4800 });
});

test('two sessions on one day are one cell and two sessions', () => {
  const trained = new Map([['2026-09-01', day('a', 6200, 2)]]);
  assert.equal(weekStrip(trained, THU).thisWeek.sessions, 2);
});

test('a week boundary at a month end does not lose a day', () => {
  // Sun 1 Mar 2026 — the strip's Monday falls in February.
  const { days } = weekStrip(none, new Date(2026, 2, 1, 10, 0));
  assert.equal(days.length, 21);
  assert.equal(days[0]?.key, '2026-02-09');
  assert.equal(days[20]?.key, '2026-03-01');
});
