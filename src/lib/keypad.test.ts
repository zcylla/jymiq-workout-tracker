import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveKeypadValue } from './keypad.ts';
import {
  LOAD_SCALE,
  RPE_SCALE,
  TARGET_LOAD_SCALE,
  TARGET_REPS_SCALE,
  TARGET_SETS_SCALE,
} from './scale.ts';

test('resolveKeypadValue snaps to the scale step and clamps into range', () => {
  assert.equal(resolveKeypadValue('83', LOAD_SCALE), 82.5);
  assert.equal(resolveKeypadValue('999', LOAD_SCALE), LOAD_SCALE.hi);
  assert.equal(resolveKeypadValue('0', LOAD_SCALE), LOAD_SCALE.lo);
  assert.equal(resolveKeypadValue('7', RPE_SCALE), 7);
});

test('resolveKeypadValue rejects empty or nonsense input', () => {
  assert.equal(resolveKeypadValue('', LOAD_SCALE), null);
  assert.equal(resolveKeypadValue('.', LOAD_SCALE), null);
});

test('a routine target keypad is whole sets, whole reps and a quarter unit of load', () => {
  assert.equal(resolveKeypadValue('4.6', TARGET_SETS_SCALE), 5);
  assert.equal(resolveKeypadValue('0', TARGET_SETS_SCALE), 1);
  assert.equal(resolveKeypadValue('99', TARGET_SETS_SCALE), 20);
  assert.equal(resolveKeypadValue('25', TARGET_REPS_SCALE), 25);
  assert.equal(resolveKeypadValue('500', TARGET_REPS_SCALE), 100);
  assert.equal(resolveKeypadValue('102.6', TARGET_LOAD_SCALE), 102.5);
  assert.equal(resolveKeypadValue('200', TARGET_LOAD_SCALE), 200);
  assert.equal(resolveKeypadValue('5000', TARGET_LOAD_SCALE), 999);
  assert.equal(resolveKeypadValue('0', TARGET_LOAD_SCALE), 0.25);
});
