import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_REST_SEC } from './rest.ts';
import { LOAD_STEPS_KG } from './scale.ts';
import { DEFAULT_PLATE_COUNTS } from './plates.ts';
import { DEFAULT_SETTINGS, coerceSettings } from './settings.ts';

test('the defaults are the behaviour the app already had', () => {
  // Opening Settings for the first time must change nothing.
  assert.equal(DEFAULT_SETTINGS.restCompoundSec, DEFAULT_REST_SEC.compound);
  assert.equal(DEFAULT_SETTINGS.restIsolationSec, DEFAULT_REST_SEC.isolation);
  assert.equal(DEFAULT_SETTINGS.weightUnit, 'kg');
  // §0: RPE ships hidden, and unset rather than pre-filled.
  assert.equal(DEFAULT_SETTINGS.trackRpe, false);
  assert.equal(DEFAULT_SETTINGS.tapOpensKeypad, false);
  assert.equal(DEFAULT_SETTINGS.weightIncrementKg, 2.5);
  assert.equal(DEFAULT_SETTINGS.defaultSets, 3);
  assert.equal(DEFAULT_SETTINGS.keepScreenOn, false);
  assert.equal(DEFAULT_SETTINGS.liveNotification, null);
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

test('a stored rest is pulled onto the rest scale', () => {
  assert.equal(coerceSettings({ restCompoundSec: 0 }).restCompoundSec, 15);
  assert.equal(coerceSettings({ restCompoundSec: 3600 }).restCompoundSec, 600);
  assert.equal(coerceSettings({ restCompoundSec: 137 }).restCompoundSec, 135);
  for (const sec of [60, 90, 120, 150, 180, 240, 300])
    assert.equal(coerceSettings({ restIsolationSec: sec }).restIsolationSec, sec);
});

test('pounds round-trip', () => {
  assert.equal(coerceSettings({ weightUnit: 'lb' }).weightUnit, 'lb');
});

test('the weekly goal is unset by default and only a whole 1-7 survives', () => {
  assert.equal(DEFAULT_SETTINGS.weeklyGoal, null);
  assert.equal(coerceSettings({ weeklyGoal: 4 }).weeklyGoal, 4);
  for (const bad of [0, 8, 2.5, '3', null, undefined])
    assert.equal(coerceSettings({ weeklyGoal: bad }).weeklyGoal, null);
});

test('the weight increment is one of the offered steps, else the default', () => {
  for (const step of LOAD_STEPS_KG)
    assert.equal(coerceSettings({ weightIncrementKg: step }).weightIncrementKg, step);
  for (const bad of [0, 3, -2.5, '5', null, Number.NaN])
    assert.equal(coerceSettings({ weightIncrementKg: bad }).weightIncrementKg, 2.5);
});

test('default sets is a whole number from 1 to 10, else 3', () => {
  for (const n of [1, 3, 10]) assert.equal(coerceSettings({ defaultSets: n }).defaultSets, n);
  for (const bad of [0, 11, 2.5, -1, '4', null, Number.NaN])
    assert.equal(coerceSettings({ defaultSets: bad }).defaultSets, 3);
});

test('keep screen on only counts a real boolean', () => {
  assert.equal(coerceSettings({ keepScreenOn: true }).keepScreenOn, true);
  assert.equal(coerceSettings({ keepScreenOn: 'yes' }).keepScreenOn, false);
  assert.equal(coerceSettings({}).keepScreenOn, false);
  assert.equal(coerceSettings({ liveNotification: false }).liveNotification, false);
  assert.equal(coerceSettings({ liveNotification: true }).liveNotification, true);
  assert.equal(coerceSettings({ liveNotification: 'no' }).liveNotification, null);
  assert.equal(coerceSettings({}).liveNotification, null);
});

test('a store from before these settings reads as the old behaviour', () => {
  const s = coerceSettings({ weightUnit: 'lb', trackRpe: true });
  assert.equal(s.weightIncrementKg, 2.5);
  assert.equal(s.defaultSets, 3);
  assert.equal(s.keepScreenOn, false);
  assert.equal(s.trackRpe, true);
});

test('plate counts default to the old kg rack and a commercial lb rack', () => {
  assert.deepEqual(DEFAULT_SETTINGS.plateCounts, DEFAULT_PLATE_COUNTS);
  assert.deepEqual(coerceSettings({}).plateCounts, DEFAULT_PLATE_COUNTS);
  assert.deepEqual(DEFAULT_PLATE_COUNTS.kg, { 25: 4, 20: 4, 15: 2, 10: 2, 5: 2, 2.5: 2, 1.25: 2 });
});

test('stored plate counts survive a round trip through JSON', () => {
  const stored = JSON.parse(
    JSON.stringify({
      plateCounts: { kg: { 25: 0, 20: 1 }, lb: { 45: 8, 35: 0, 2.5: 3 } },
    }),
  );
  const s = coerceSettings(stored);
  assert.equal(s.plateCounts.kg[25], 0);
  assert.equal(s.plateCounts.kg[20], 1);
  assert.equal(s.plateCounts.lb[45], 8);
  assert.equal(s.plateCounts.lb[35], 0);
  assert.equal(s.plateCounts.lb[2.5], 3);
});

test('one bad plate count falls back alone and the rest survive', () => {
  const s = coerceSettings({
    plateCounts: { kg: { 25: 9, 20: 1.5, 15: '2', 10: -1, 5: 1, 2.5: null }, lb: 'nonsense' },
  });
  assert.equal(s.plateCounts.kg[25], DEFAULT_PLATE_COUNTS.kg[25]);
  assert.equal(s.plateCounts.kg[20], DEFAULT_PLATE_COUNTS.kg[20]);
  assert.equal(s.plateCounts.kg[15], DEFAULT_PLATE_COUNTS.kg[15]);
  assert.equal(s.plateCounts.kg[10], DEFAULT_PLATE_COUNTS.kg[10]);
  assert.equal(s.plateCounts.kg[5], 1);
  assert.equal(s.plateCounts.kg[2.5], DEFAULT_PLATE_COUNTS.kg[2.5]);
  assert.deepEqual(s.plateCounts.lb, DEFAULT_PLATE_COUNTS.lb);
  for (const bad of [null, 'x', 7, [], { kg: null }])
    assert.deepEqual(coerceSettings({ plateCounts: bad }).plateCounts, DEFAULT_PLATE_COUNTS);
});

test('plate counts only keep denominations the unit has', () => {
  const s = coerceSettings({ plateCounts: { kg: { 45: 3 }, lb: { 20: 3 } } });
  assert.deepEqual(s.plateCounts, DEFAULT_PLATE_COUNTS);
});

test('a store from before plate counts reads as the defaults', () => {
  const s = coerceSettings({ weightUnit: 'lb', trackRpe: true });
  assert.deepEqual(s.plateCounts, DEFAULT_PLATE_COUNTS);
});
