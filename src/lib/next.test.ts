import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dueLabel, lastRunLabel } from './next.ts';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 13, 12, 0);

test('the last run is whole days, and NEW before the first', () => {
  assert.equal(lastRunLabel(null, NOW), 'NEW');
  assert.equal(lastRunLabel(NOW - 2 * 3600_000, NOW), '0D');
  assert.equal(lastRunLabel(NOW - 1 * DAY, NOW), '1D');
  assert.equal(lastRunLabel(NOW - 5 * DAY, NOW), '5D');
});

test('a clock that has gone backwards reads as 0D, never as negative days', () => {
  assert.equal(lastRunLabel(NOW + 3600_000, NOW), '0D');
});

test('the due label names the two near days and dates everything else', () => {
  const fri = new Date(2026, 8, 18, 0, 0).getTime();
  assert.equal(dueLabel(0, NOW), 'TODAY');
  assert.equal(dueLabel(1, NOW), 'TOMORROW');
  assert.equal(dueLabel(5, fri), 'FRI 18 SEP');
});
