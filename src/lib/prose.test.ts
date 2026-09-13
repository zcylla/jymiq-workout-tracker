import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sameProse } from './prose.ts';

test('steps joined back into their own paragraph are the same prose', () => {
  const steps = [
    'Lie flat on a bench with your feet flat on the ground.',
    'Grasp the barbell with an overhand grip.',
  ];
  assert.equal(sameProse(steps.join(' '), steps), true);
});

test('punctuation and spacing moved by the split still compare equal', () => {
  // The real failure mode: a sentence splitter that drops the period and the
  // double space would defeat a whitespace-only comparison.
  assert.equal(
    sameProse('Set the bench to 45 degrees.  Lie down, then press.', [
      'Set the bench to 45 degrees',
      'Lie down then press',
    ]),
    true,
  );
});

test('genuinely different prose keeps both blocks', () => {
  assert.equal(
    sameProse('The squat is the reference lift for leg strength.', [
      'Bar on the rear delts, not the neck.',
    ]),
    false,
  );
});

test('cues that only cover part of the description keep both blocks', () => {
  assert.equal(sameProse('One. Two. Three.', ['One.', 'Two.']), false);
});

test('nothing to compare against is not a duplicate', () => {
  assert.equal(sameProse(null, ['Brace the core.']), false);
  assert.equal(sameProse('Brace the core.', []), false);
  assert.equal(sameProse('   ', ['   ']), false);
});
