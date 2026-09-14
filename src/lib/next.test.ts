import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dueLabel, lastRunLabel } from './next.ts';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 13, 12, 0);

test('the kicker counts whole days and names the near ones', () => {
  assert.equal(lastRunLabel(null, NOW), 'NEVER RUN');
  assert.equal(lastRunLabel(NOW - 2 * 3600_000, NOW), 'LAST RUN TODAY');
  assert.equal(lastRunLabel(NOW - 1 * DAY, NOW), 'LAST RUN YESTERDAY');
  assert.equal(lastRunLabel(NOW - 5 * DAY, NOW), 'LAST RUN 5 DAYS AGO');
});

test('a clock that has gone backwards reads as today, never as negative days', () => {
  assert.equal(lastRunLabel(NOW + 3600_000, NOW), 'LAST RUN TODAY');
});

test('the due label names the two near days and dates everything else', () => {
  const fri = new Date(2026, 8, 18, 0, 0).getTime();
  assert.equal(dueLabel(0, NOW), 'TODAY');
  assert.equal(dueLabel(1, NOW), 'TOMORROW');
  assert.equal(dueLabel(5, fri), 'FRI 18 SEP');
});
