import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dayState } from './day-state.ts';
import { NO_SCHEDULE, type Schedule } from './program.ts';

/** Mon Lower, Wed Upper, Fri Lower — running since Mon 2026-09-07. */
const program: Schedule<string> = {
  days: new Map([
    [0, 'Lower'],
    [2, 'Upper'],
    [4, 'Lower'],
  ]),
  since: '2026-09-07',
};

const TODAY = '2026-09-09'; // Wednesday

test('a trained day is done, whatever the plan said', () => {
  assert.deepEqual(dayState(program, '2026-09-08', 1, true, TODAY), { mark: 'done', today: false });
  assert.deepEqual(dayState(NO_SCHEDULE, TODAY, 2, true, TODAY), { mark: 'done', today: true });
});

test('a scheduled past day nobody trained is missed; an unscheduled one is rest', () => {
  assert.equal(dayState(program, '2026-09-07', 0, false, TODAY).mark, 'missed');
  assert.equal(dayState(program, '2026-09-08', 1, false, TODAY).mark, 'rest');
});

test('a scheduled day ahead is planned, and today is planned until it is trained', () => {
  assert.equal(dayState(program, '2026-09-11', 4, false, TODAY).mark, 'planned');
  assert.deepEqual(dayState(program, TODAY, 2, false, TODAY), { mark: 'planned', today: true });
  assert.equal(dayState(program, '2026-09-10', 3, false, TODAY).mark, 'rest');
});

test('an unscheduled today is rest, still flagged as today', () => {
  assert.deepEqual(dayState(program, '2026-09-10', 3, false, '2026-09-10'), {
    mark: 'rest',
    today: true,
  });
});

test('with nothing running there is no plan and no lapse', () => {
  assert.equal(dayState(NO_SCHEDULE, '2026-09-11', 4, false, TODAY).mark, 'rest');
  assert.equal(dayState(NO_SCHEDULE, '2026-09-07', 0, false, TODAY).mark, 'rest');
});

test('nothing before the program started is missed', () => {
  assert.equal(dayState(program, '2026-08-31', 0, false, TODAY).mark, 'rest');
});
