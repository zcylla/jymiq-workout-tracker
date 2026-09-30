import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BACKGROUNDS,
  BLUR_LEVELS,
  DEFAULT_TRIAL,
  type Element,
  GLASS_STYLES,
  type GlassTrial,
  PRESETS,
  SCOPES,
  type Scope,
  appliesTo,
  coerceTrial,
  glassOf,
  isShipped,
  screenBlurs,
} from './glass-trial.ts';

test('the default trial is the look that already shipped', () => {
  assert.deepEqual(DEFAULT_TRIAL, { style: 'tint', blur: 0, background: 'dots', scope: 'hero' });
  assert.equal(isShipped(DEFAULT_TRIAL), true);
});

test('nothing readable in the store gives the default trial', () => {
  assert.deepEqual(coerceTrial(null), DEFAULT_TRIAL);
  assert.deepEqual(coerceTrial('frost'), DEFAULT_TRIAL);
  assert.deepEqual(coerceTrial([]), DEFAULT_TRIAL);
});

test('one bad key falls back alone and the rest survive', () => {
  const t = coerceTrial({ style: 'frost', blur: 35, background: 'stripes', scope: 'cards' });
  assert.deepEqual(t, { style: 'frost', blur: 0, background: 'dots', scope: 'cards' });
});

test('every level of every axis survives a round trip', () => {
  for (const style of GLASS_STYLES)
    for (const blur of BLUR_LEVELS)
      for (const background of BACKGROUNDS)
        for (const scope of SCOPES) {
          const t: GlassTrial = { style, blur, background, scope };
          assert.deepEqual(coerceTrial(JSON.parse(JSON.stringify(t))), t);
        }
});

const TABLE: Record<Scope, Element[]> = {
  off: [],
  hero: ['hero'],
  'hero+inner': ['hero', 'inner'],
  cards: ['hero', 'plate'],
  all: ['hero', 'plate', 'row'],
  chrome: ['chrome'],
  'chrome+hero': ['chrome', 'hero'],
};

test('appliesTo: every scope against every element', () => {
  const elements: Element[] = ['hero', 'inner', 'plate', 'row', 'chrome'];
  for (const scope of SCOPES)
    for (const element of elements)
      assert.equal(
        appliesTo(scope, element),
        TABLE[scope].includes(element),
        `${scope} ${element}`,
      );
});

test('every preset is a valid trial, and the first is today', () => {
  assert.ok(PRESETS.length >= 6);
  for (const p of PRESETS) assert.deepEqual(coerceTrial(p.trial), p.trial, p.label);
  assert.deepEqual(PRESETS[0].trial, DEFAULT_TRIAL);
  assert.equal(new Set(PRESETS.map((p) => p.label)).size, PRESETS.length);
});

test('the shipped trial glasses only the two shipped cards', () => {
  assert.deepEqual(glassOf(DEFAULT_TRIAL, 'hero'), { glass: true, blur: 0 });
  assert.deepEqual(glassOf(DEFAULT_TRIAL, 'hero', true), { glass: false, blur: 0 });
  const changed = { ...DEFAULT_TRIAL, background: 'grid' } as const;
  assert.deepEqual(glassOf(changed, 'hero', true), { glass: true, blur: 0 });
});

test('style off or scope off is opaque everywhere', () => {
  for (const element of ['hero', 'inner', 'plate', 'row', 'chrome'] as Element[]) {
    assert.equal(glassOf({ ...DEFAULT_TRIAL, style: 'off', scope: 'all' }, element).glass, false);
    assert.equal(glassOf({ ...DEFAULT_TRIAL, scope: 'off' }, element).glass, false);
  }
});

test('blur only for a blurring style, a level above zero, and never on inner tiles', () => {
  const frost: GlassTrial = { style: 'frost', blur: 40, background: 'mesh', scope: 'hero+inner' };
  assert.deepEqual(glassOf(frost, 'hero'), { glass: true, blur: 40 });
  assert.deepEqual(glassOf(frost, 'inner'), { glass: true, blur: 0 });
  assert.deepEqual(glassOf({ ...frost, blur: 0 }, 'hero'), { glass: true, blur: 0 });
  assert.deepEqual(glassOf({ ...frost, style: 'tint' }, 'hero'), { glass: true, blur: 0 });
  assert.deepEqual(glassOf(frost, 'plate'), { glass: false, blur: 0 });
});

test('a screen carries a blur target only when a surface on it blurs', () => {
  assert.equal(screenBlurs(DEFAULT_TRIAL), false);
  assert.equal(screenBlurs({ style: 'frost', blur: 40, background: 'dots', scope: 'hero' }), true);
  assert.equal(
    screenBlurs({ style: 'frost', blur: 40, background: 'dots', scope: 'chrome' }),
    false,
  );
  assert.equal(screenBlurs({ style: 'frost', blur: 0, background: 'dots', scope: 'all' }), false);
  assert.equal(screenBlurs({ style: 'tint', blur: 80, background: 'dots', scope: 'all' }), false);
});
