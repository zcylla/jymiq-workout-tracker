import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_REST_SEC } from './rest.ts';
import { DEFAULT_SETTINGS, coerceSettings } from './settings.ts';

test('the defaults are the behaviour the app already had', () => {
  // Opening Settings for the first time must change nothing.
  assert.equal(DEFAULT_SETTINGS.restCompoundSec, DEFAULT_REST_SEC.compound);
  assert.equal(DEFAULT_SETTINGS.restIsolationSec, DEFAULT_REST_SEC.isolation);
  assert.equal(DEFAULT_SETTINGS.weightUnit, 'kg');
  // §0: RPE ships hidden, and unset rather than pre-filled.
  assert.equal(DEFAULT_SETTINGS.trackRpe, false);
  assert.equal(DEFAULT_SETTINGS.tapOpensKeypad, false);
});

test('nothing readable in the store gives the defaults rather than a crash', () => {
  assert.deepEqual(coerceSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(coerceSettings('nonsense'), DEFAULT_SETTINGS);
  assert.deepEqual(coerceSettings([]), DEFAULT_SETTINGS);
});

test('one bad key falls back alone and the rest survive', () => {
  const s = coerceSettings({
    weightUnit: 'stone',
    restCompoundSec: 240,
    restIsolationSec: -5,
    trackRpe: true,
    tapOpensKeypad: 'yes',
  });
  assert.equal(s.weightUnit, 'kg'); // unrecognised unit
  assert.equal(s.restCompoundSec, 240); // kept
  assert.equal(s.restIsolationSec, DEFAULT_SETTINGS.restIsolationSec); // out of range
  assert.equal(s.trackRpe, true); // kept
  assert.equal(s.tapOpensKeypad, false); // only a real boolean counts
});

test('a rest of zero is a choice, not a missing value', () => {
  assert.equal(coerceSettings({ restCompoundSec: 0 }).restCompoundSec, 0);
});

test('pounds round-trip', () => {
  assert.equal(coerceSettings({ weightUnit: 'lb' }).weightUnit, 'lb');
});
