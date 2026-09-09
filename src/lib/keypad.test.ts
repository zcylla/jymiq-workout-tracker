import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveKeypadValue } from './keypad.ts';
import { LOAD_SCALE, RPE_SCALE } from './scale.ts';

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
