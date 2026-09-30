import assert from 'node:assert/strict';
import { test } from 'node:test';

import { targetLoadScale } from './scale.ts';
import { formatWeight, toKg } from './units.ts';

test('toKg leaves kilograms alone and converts pounds without a float tail', () => {
  assert.equal(toKg(102.5, 'kg'), 102.5);
  assert.equal(toKg(225, 'lb'), 102.058);
  assert.equal(toKg(0, 'lb'), 0);
});

test('a pound load typed in reads back as the same pounds', () => {
  assert.equal(formatWeight(toKg(225, 'lb'), 'lb'), '225');
  assert.equal(formatWeight(toKg(135.5, 'lb'), 'lb'), '135.5');
});

test('every load a target keypad can write reads back as itself in its own unit', () => {
  for (const unit of ['kg', 'lb'] as const) {
    const scale = targetLoadScale(unit);
    for (let i = 0; i < scale.n; i++) {
      const typed = scale.lo + i * scale.step;
      assert.equal(formatWeight(toKg(typed, unit), unit), String(typed), `${typed} ${unit}`);
    }
  }
});
