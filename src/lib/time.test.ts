import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  SESSION_DURATION_CEILING_SEC,
  dateLabel,
  isPlausibleDuration,
  sessionDateLabel,
} from './time.ts';

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
