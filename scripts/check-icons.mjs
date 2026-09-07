#!/usr/bin/env node
/**
 * Guard the icon set's house style.
 *
 * The icons are hand-drawn (ported from claudedocs/design-labs/kit.py) rather
 * than taken from a library, so nothing outside this file enforces that a new
 * one looks like the others. This does: it is wired into `npm run check`, so an
 * off-style icon fails the build instead of quietly shipping.
 *
 * The load-bearing rule is the last one. Every icon is authored in its own
 * square box, and the box is chosen to suit the size the icon is drawn at — so
 * the constant that has to hold is not the stroke width, and not the ratio, but
 * the width the stroke ends up being ON SCREEN.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'icons', 'ui');

/** The size each icon is actually rendered at. Adding an icon means adding it here. */
const DRAWN_AT = {
  today: 22, session: 22, strength: 22, load: 22, search: 22,
  gear: 22, back: 22, plus: 22, cal: 22, dots: 22,
  chev: 13, up: 9, down: 9,
};

/** kit's on-screen stroke widths run 1.38 (chev) to 1.80 (back). */
const MIN_PT = 1.3;
const MAX_PT = 1.9;

const attr = (svg, name) => svg.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const fail = [];

const files = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
const names = files.map((f) => f.replace(/\.svg$/, ''));

for (const missing of Object.keys(DRAWN_AT).filter((n) => !names.includes(n))) {
  fail.push(`${missing}: listed in DRAWN_AT but has no .svg`);
}

for (const name of names) {
  const svg = readFileSync(join(dir, `${name}.svg`), 'utf8');
  const say = (msg) => fail.push(`${name}.svg: ${msg}`);

  const box = attr(svg, 'viewBox')?.match(/^0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)$/);
  if (!box) say('viewBox must be "0 0 N N"');
  else if (box[1] !== box[2]) say(`viewBox must be square, got ${box[1]}x${box[2]}`);

  if (attr(svg, 'fill') !== 'none') say('root needs fill="none" — icons are strokes, not shapes');
  if (attr(svg, 'stroke') !== '#000000') say('root needs stroke="#000000" — one layer, recoloured at runtime');
  if (attr(svg, 'stroke-linecap') !== 'round') say('root needs stroke-linecap="round"');
  if (attr(svg, 'stroke-linejoin') !== 'round') say('root needs stroke-linejoin="round"');

  const shapes = [...svg.matchAll(/<(\w+)/g)].map((m) => m[1]).filter((t) => t !== 'svg');
  const bad = [...new Set(shapes.filter((t) => t !== 'path'))];
  if (bad.length) say(`only <path> is allowed, found <${bad.join('>, <')}> — convert to path data`);
  if (/fill="(?!none)/.test(svg.replace(/<svg[^>]*>/, ''))) say('a child carries a fill — icons are strokes');

  const size = DRAWN_AT[name];
  if (size === undefined) {
    say('not in DRAWN_AT — add it with the size this icon is rendered at');
  } else if (box) {
    const width = Number(attr(svg, 'stroke-width'));
    const onScreen = (width / Number(box[1])) * size;
    if (!(onScreen >= MIN_PT && onScreen <= MAX_PT)) {
      say(
        `stroke reads ${onScreen.toFixed(2)}pt on screen ` +
          `(${width} in a ${box[1]} box, drawn at ${size}pt); the set runs ${MIN_PT}–${MAX_PT}pt`,
      );
    }
  }
}

if (fail.length) {
  console.error(`\nicon set: ${fail.length} problem${fail.length > 1 ? 's' : ''}\n`);
  for (const f of fail) console.error(`  ${f}`);
  console.error('\nSee "Icons" in AGENTS.md.\n');
  process.exit(1);
}
console.log(`icon set: ${names.length} icons, all on style`);
