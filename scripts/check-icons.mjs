#!/usr/bin/env node
/** Guard complete free-pack mappings and the calibrated on-screen stroke weight. */
import * as freeIcons from '@hugeicons/core-free-icons';

import { ICON_MAP } from '../src/components/icon-map.ts';
import { ICON_NAMES, ICON_SIZE, ICON_STROKE_WIDTH } from '../src/components/icon-sizes.ts';

const MIN_PT = 1.3;
const MAX_PT = 1.9;
const fail = [];
const names = new Set(ICON_NAMES);
const freeData = new Set(
  Object.entries(freeIcons)
    .filter(([name]) => name.endsWith('Icon'))
    .map(([, icon]) => JSON.stringify(icon)),
);

if (names.size !== ICON_NAMES.length) fail.push('ICON_NAMES contains duplicate names');

for (const [label, table] of [
  ['ICON_SIZE', ICON_SIZE],
  ['ICON_STROKE_WIDTH', ICON_STROKE_WIDTH],
  ['ICON_MAP', ICON_MAP],
]) {
  for (const name of names) {
    if (!Object.hasOwn(table, name)) fail.push(`${name}: missing from ${label}`);
  }
  for (const name of Object.keys(table)) {
    if (!names.has(name)) fail.push(`${name}: in ${label} but not declared in ICON_NAMES`);
  }
}

for (const name of names) {
  const size = ICON_SIZE[name];
  const strokeWidth = ICON_STROKE_WIDTH[name];
  const icon = ICON_MAP[name];
  const say = (message) => fail.push(`${name}: ${message}`);

  if (!(Number.isFinite(size) && size > 0)) say('size must be a positive finite number');
  if (!(Number.isFinite(strokeWidth) && strokeWidth > 0))
    say('stroke width must be a positive finite number');
  const onScreen = (strokeWidth * size) / 24;
  if (!(onScreen >= MIN_PT && onScreen <= MAX_PT))
    say(`stroke reads ${onScreen.toFixed(3)}pt on screen; the set runs ${MIN_PT}–${MAX_PT}pt`);

  if (!Array.isArray(icon) || !icon.length || !freeData.has(JSON.stringify(icon))) {
    say('mapping must be an icon exported by @hugeicons/core-free-icons');
    continue;
  }
  for (const [tag, attrs] of icon) {
    if (!['path', 'circle', 'rect', 'line'].includes(tag)) say(`unsupported element: ${tag}`);
    if (attrs.fill !== undefined && attrs.fill !== 'none') say('icons must have no fills');
    if (attrs.stroke !== 'currentColor') say('strokes must follow the Ink tone');
    for (const property of ['strokeLinecap', 'strokeLinejoin']) {
      if (attrs[property] !== undefined && attrs[property] !== 'round')
        say(`${property} must be round (or inherit the renderer's round default)`);
    }
  }
}

if (fail.length) {
  console.error(`\nicon set: ${fail.length} problem${fail.length > 1 ? 's' : ''}\n`);
  for (const problem of fail) console.error(`  ${problem}`);
  console.error('\nSee "Icons" in AGENTS.md.\n');
  process.exit(1);
}
console.log(`icon set: ${names.size} free icons, complete sizes/strokes/mappings, all on style`);
