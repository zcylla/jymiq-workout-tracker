import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { TrainedDay } from './calendar.ts';
import { sessionsMeter, weekBounds, weekStrip } from './week.ts';

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

test('today is a flag on a mark, and only one day carries it', () => {
  const { days, todayIndex } = weekStrip(none, THU);
  assert.equal(days[todayIndex]?.key, '2026-09-04');
  assert.deepEqual(
    days.filter((d) => d.today).map((d) => d.key),
    ['2026-09-04'],
  );
  assert.equal(days[todayIndex]?.mark, 'rest');
});

test('a trained past day is done and carries the session it opens', () => {
  const trained = new Map([['2026-09-01', day('s1', 6200)]]);
  const cell = weekStrip(trained, THU).days.find((d) => d.key === '2026-09-01');
  assert.equal(cell?.mark, 'done');
  assert.equal(cell?.sessionId, 's1');
  assert.equal(cell?.volumeKg, 6200);
});

test('an untrained day is never a target', () => {
  for (const cell of weekStrip(none, THU).days) {
    assert.equal(cell.sessionId, null);
  }
});

test('a trained today is done and flagged today, and stays openable', () => {
  const trained = new Map([['2026-09-04', day('s9', 5000)]]);
  const { days, todayIndex } = weekStrip(trained, THU);
  assert.equal(days[todayIndex]?.mark, 'done');
  assert.equal(days[todayIndex]?.today, true);
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

test('an untrained past day is rest when no program is running', () => {
  const { days } = weekStrip(none, THU);
  // Wednesday of this week — yesterday.
  assert.equal(days[16]?.mark, 'rest');
});

const push = { id: 'push', name: 'Push' };
const pull = { id: 'pull', name: 'Pull' };

test('a past day the running program scheduled and you skipped is missed', () => {
  const schedule = { days: new Map([[2, push]]), since: '2026-08-17' };
  const { days } = weekStrip(none, THU, schedule);
  assert.equal(days[16]?.key, '2026-09-02');
  assert.equal(days[16]?.mark, 'missed');
  // Tuesday has nothing on it, so it stays rest — §0 wants the two different.
  assert.equal(days[15]?.mark, 'rest');
});

test('a scheduled day you trained is done, not missed', () => {
  const schedule = { days: new Map([[2, push]]), since: '2026-08-17' };
  const { days } = weekStrip(new Map([['2026-09-02', day('s1', 4000)]]), THU, schedule);
  assert.equal(days[16]?.mark, 'done');
});

test('a planned today is planned and flagged; scheduled days ahead are planned', () => {
  const schedule = {
    days: new Map([
      [3, push],
      [4, pull],
    ]),
    since: '2026-08-17',
  };
  const { days } = weekStrip(none, THU, schedule);
  assert.equal(days[18]?.key, '2026-09-04');
  assert.equal(days[18]?.mark, 'planned');
  assert.equal(days[18]?.today, true);
  assert.equal(days[19]?.mark, 'rest');
});

test("the meter denominator is the running program's planned days, or zero", () => {
  const schedule = {
    days: new Map([
      [0, push],
      [2, pull],
      [4, push],
    ]),
    since: '2026-08-17',
  };
  assert.equal(weekStrip(none, THU, schedule).plannedPerWeek, 3);
  assert.equal(weekStrip(none, THU).plannedPerWeek, 0);
  assert.equal(weekStrip(none, THU, { days: schedule.days, since: null }).plannedPerWeek, 0);
});

test('weekBounds: this week is the Monday-first week the strip puts today in', () => {
  const b = weekBounds(THU);
  assert.deepEqual(new Date(b.thisFrom), new Date(2026, 7, 31));
  assert.deepEqual(new Date(b.lastFrom), new Date(2026, 7, 24));
  assert.deepEqual(new Date(b.to), new Date(2026, 8, 7));
});

test('the sessions meter: a running program wins over the goal', () => {
  assert.equal(sessionsMeter(2, 4, 6), 0.5);
});

test('the sessions meter falls back to the goal when no program runs', () => {
  assert.equal(sessionsMeter(3, 0, 6), 0.5);
});

test('the sessions meter is absent with neither a program nor a goal', () => {
  assert.equal(sessionsMeter(3, 0, null), null);
});

test('the sessions meter stops at full when sessions pass the target', () => {
  assert.equal(sessionsMeter(8, 0, 6), 1);
  assert.equal(sessionsMeter(5, 3, null), 1);
});
