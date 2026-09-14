import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lastRunLabel, pickNextRoutine } from './next.ts';

const r = (id: string, position: number) => ({ id, name: id, position });
/** routineListQuery orders by position, so the input is always sorted. */
const ROUTINES = [r('upper', 0), r('lower', 1), r('pull', 2)];

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 13, 12, 0);

test('nothing to offer when there are no routines', () => {
  assert.equal(pickNextRoutine([], new Map()), null);
});

test('a fresh install offers the first routine rather than nothing', () => {
  const next = pickNextRoutine(ROUTINES, new Map());
  assert.equal(next?.routine.id, 'upper');
  assert.equal(next?.lastRunAt, null);
});

test('the routine trained least recently is the one that is due', () => {
  const next = pickNextRoutine(
    ROUTINES,
    new Map([
      ['upper', NOW - 1 * DAY],
      ['lower', NOW - 5 * DAY],
      ['pull', NOW - 3 * DAY],
    ]),
  );
  assert.equal(next?.routine.id, 'lower');
});

test('a routine never run outranks one trained long ago', () => {
  const next = pickNextRoutine(
    ROUTINES,
    new Map([
      ['upper', NOW - 90 * DAY],
      ['lower', NOW - 1 * DAY],
    ]),
  );
  assert.equal(next?.routine.id, 'pull');
  assert.equal(next?.lastRunAt, null);
});

test('a tie is broken by position, not by map order', () => {
  const next = pickNextRoutine(
    ROUTINES,
    new Map([
      ['pull', NOW - 5 * DAY],
      ['lower', NOW - 5 * DAY],
      ['upper', NOW - 1 * DAY],
    ]),
  );
  assert.equal(next?.routine.id, 'lower');
});

test('a last run that is not one of the listed routines is ignored', () => {
  // An archived routine still has sessions pointing at it.
  const next = pickNextRoutine([r('upper', 0)], new Map([['archived', NOW - 99 * DAY]]));
  assert.equal(next?.routine.id, 'upper');
});

test('the kicker counts whole days and names the near ones', () => {
  assert.equal(lastRunLabel(null, NOW), 'NEVER RUN');
  assert.equal(lastRunLabel(NOW - 2 * 3600_000, NOW), 'LAST RUN TODAY');
  assert.equal(lastRunLabel(NOW - 1 * DAY, NOW), 'LAST RUN YESTERDAY');
  assert.equal(lastRunLabel(NOW - 5 * DAY, NOW), 'LAST RUN 5 DAYS AGO');
});

test('a clock that has gone backwards reads as today, never as negative days', () => {
  assert.equal(lastRunLabel(NOW + 3600_000, NOW), 'LAST RUN TODAY');
});
