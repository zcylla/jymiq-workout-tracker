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
  chromeBlurs,
  coerceTrial,
  glassOf,
  screenBlurs,
} from './glass-trial.ts';

test('the default trial is the look that already shipped', () => {
  assert.deepEqual(DEFAULT_TRIAL, {
    style: 'frost',
    blur: 20,
    background: 'dots',
    scope: 'cards+chrome',
  });
});

test('nothing readable in the store gives the default trial', () => {
  assert.deepEqual(coerceTrial(null), DEFAULT_TRIAL);
  assert.deepEqual(coerceTrial('frost'), DEFAULT_TRIAL);
  assert.deepEqual(coerceTrial([]), DEFAULT_TRIAL);
});

test('one bad key falls back alone and the rest survive', () => {
  const t = coerceTrial({ style: 'frost', blur: 35, background: 'stripes', scope: 'cards' });
  assert.deepEqual(t, { style: 'frost', blur: 20, background: 'dots', scope: 'cards' });
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
  'cards+chrome': ['hero', 'plate', 'chrome'],
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

test('the default glasses heroes, plates, and chrome with a light blur, never rows', () => {
  assert.deepEqual(glassOf(DEFAULT_TRIAL, 'hero'), { glass: true, blur: 20 });
  assert.deepEqual(glassOf(DEFAULT_TRIAL, 'plate'), { glass: true, blur: 20 });
  assert.deepEqual(glassOf(DEFAULT_TRIAL, 'row'), { glass: false, blur: 0 });
  assert.deepEqual(glassOf(DEFAULT_TRIAL, 'chrome'), { glass: true, blur: 20 });
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
  assert.equal(screenBlurs(DEFAULT_TRIAL), true);
  assert.equal(screenBlurs({ ...DEFAULT_TRIAL, blur: 0 }), false);
  assert.equal(screenBlurs({ style: 'frost', blur: 40, background: 'dots', scope: 'hero' }), true);
  assert.equal(
    screenBlurs({ style: 'frost', blur: 40, background: 'dots', scope: 'chrome' }),
    false,
  );
  assert.equal(screenBlurs({ style: 'frost', blur: 0, background: 'dots', scope: 'all' }), false);
  assert.equal(screenBlurs({ style: 'tint', blur: 80, background: 'dots', scope: 'all' }), false);
});

test('chrome blur follows chrome scopes and blurring styles', () => {
  assert.equal(chromeBlurs(DEFAULT_TRIAL), true);
  assert.equal(chromeBlurs({ ...DEFAULT_TRIAL, scope: 'chrome' }), true);
  assert.equal(chromeBlurs({ ...DEFAULT_TRIAL, scope: 'chrome+hero' }), true);
  assert.equal(chromeBlurs({ ...DEFAULT_TRIAL, scope: 'cards' }), false);
  assert.equal(chromeBlurs({ ...DEFAULT_TRIAL, style: 'tint' }), false);
  assert.equal(chromeBlurs({ ...DEFAULT_TRIAL, blur: 0 }), false);
  assert.equal(chromeBlurs({ ...DEFAULT_TRIAL, style: 'off' }), false);
});
