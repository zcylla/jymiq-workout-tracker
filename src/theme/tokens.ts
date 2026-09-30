/**
 * The locked design tokens. THIS IS THE ONLY FILE IN THE APP CONTAINING A HEX
 * LITERAL — see claudedocs/design-exploration.md §0 and claudedocs/design-labs/kit.py.
 *
 * One fixed dark identity. There is no light theme and no color-scheme hook:
 * the palette is the product's face, not a preference.
 */

/** Palette V2 (Lab 22). Provisional pending a look on real hardware. */
export const color = {
  ground: '#0a0908',
  panel: '#15130f',
  raised: '#221f19',

  accent: '#e4c68c',
  done: '#9fae3a',
  live: '#df5441',

  hi: '#f6f3ec',
  mid: '#c9c3b6',
  lo: '#8c8677',
  dim: '#6f6a5e',

  tick1: '#5a5449',
  tick2: '#7d7666',
  tick3: '#a8a091',
  off: '#2a2720',

  /** Glyphs and text on an accent fill. */
  ink: '#15130f',
} as const;

/**
 * A hairline's contrast is relative to its surface (§0): 11% white reads on the
 * near-black canvas and washes out on a lifted plate. Every hairline has both.
 */
export const hairline = {
  onGround: 'rgba(255,255,255,0.11)',
  onPlate: 'rgba(255,255,255,0.20)',
  /** The rule running right from a section label. */
  ruled: 'rgba(255,255,255,0.10)',
  /** Separators between rows inside one plate (start at the text margin). */
  inset: 'rgba(255,255,255,0.07)',
  /** A chart's baseline. */
  baseline: 'rgba(255,255,255,0.15)',
} as const;

/** Spacing law: between-section space >= 3x within-section space. */
export const space = {
  between: 46,
  within: 11,
  /** Between row plates — the gap that replaced every list hairline (Lab 42). */
  row: 7,
  pad: 22,
} as const;

/**
 * kit `phone()`'s ground is not flat: a dot field fixed to the screen and two
 * blurred blooms of one colour sit under every screen's content. The panels' "lit" quality
 * comes from the bloom (design-exploration §6), so a flat ground loses it.
 */
export const field = {
  dot: 'rgba(255,255,255,0.08)',
  /** kit `.field` background-size. */
  pitch: 18,
  bloom: 'rgba(228,198,140,0.13)',
  /** CSS `filter: blur(88px)` — a Gaussian standard deviation, which is Skia's sigma too. */
  bloomBlur: 88,
} as const;

/** The bodyweight chart's fill: `accent` fading to nothing under the line. */
export const trend = {
  fillTop: 'rgba(228,198,140,0.26)',
  fillBottom: 'rgba(228,198,140,0)',
} as const;

export const radius = {
  row: 12,
  plate: 14,
  tile: 12,
  bar: 20,
  sheet: 26,
  chip: 11,
  pill: 5,
  cell: 8,
  full: 9999,
} as const;

export const size = {
  /** Touch-target floor. Visually smaller controls keep their drawn size and
   *  expand hitSlop instead. */
  hit: 44,
  /** A read-only table row is 34, not 44 — the floor is for targets (Lab 36). */
  readRow: 34,
  sheetRow: 38,
  typeFloor: 11,
  ringRest: 330,
  ringEdit: 290,
  tapeRow: 31,
} as const;

/**
 * The three containment levels (Lab 42 P5). The names are the decision rule:
 *   rowPlate     — you touch this row
 *   groupedPlate — this is one of the screen's two or three main components
 *   none         — it already has structure (chart, rail, table), or it is prose
 */
export const litEdge = 'inset 0 1px 0 rgba(255,255,255,0.075), inset 0 -1px 0 rgba(0,0,0,0.28)';

export const containment = {
  rowPlate: {
    backgroundColor: color.raised,
    borderRadius: radius.row,
    borderCurve: 'continuous',
    boxShadow: litEdge,
  },
  groupedPlate: {
    backgroundColor: color.raised,
    borderRadius: radius.plate,
    borderCurve: 'continuous',
    padding: 15,
    boxShadow: litEdge,
  },
  glassPlate: {
    backgroundColor: 'rgba(38,34,27,0.58)',
    borderRadius: radius.plate,
    borderCurve: 'continuous',
    padding: 15,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.13)',
    experimental_backgroundImage:
      'linear-gradient(180deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.025) 55%, rgba(255,255,255,0.05) 100%)',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.30), 0 10px 28px rgba(0,0,0,0.42)',
  },
  none: {},
} as const;

/**
 * Chrome sits above content: glass on iOS 26, an opaque plate on Android (Lab 43 N2).
 * Same lit edge as every other plate — the bar is part of the system, not a special
 * case — with a heavier drop shadow doing the separating that blur did.
 */
export const chromeShadow = `${litEdge}, 0 12px 30px rgba(0,0,0,0.62)`;

/** kit .fab — the start button. A brighter lit edge than a plate, on an accent fill. */
export const fabShadow = 'inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 26px rgba(0,0,0,0.50)';

export const motion = {
  fast: 140,
  base: 240,
  slow: 380,
} as const;

/**
 * Washes — a hue at low alpha used as a fill *behind* something, never as a step
 * in the text ramp. The alphas are the ones the boards use (kit.meter's track,
 * kit.pill's default tint), not derived from the palette.
 */
export const wash = {
  track: 'rgba(255,255,255,0.08)',
  /** A chart column that is not the active one. */
  column: 'rgba(255,255,255,0.16)',
  /** A field's ground, and a chip that is off. Not a plate — no lit edge. */
  field: 'rgba(255,255,255,0.05)',
  /** A toggle's track when off. */
  off: 'rgba(255,255,255,0.10)',
  /** A chip that is on. One step up from `accent`, which the boards use for pills. */
  chip: 'rgba(228,198,140,0.15)',
  accent: 'rgba(228,198,140,0.13)',
  done: 'rgba(159,174,58,0.16)',
  live: 'rgba(223,84,65,0.14)',
  /** Behind a sheet. Dark enough to kill the plate edges underneath it. */
  scrim: 'rgba(10,9,8,0.62)',
} as const;

/**
 * The two marks of the day-state grammar (Lab 49 D1) that are not a fill: the
 * dashed outline of a planned day and the hatching of a missed one. Drawn in
 * Skia, so they are strings the canvas takes rather than styles.
 */
export const dayMark = {
  dash: 'rgba(228,198,140,0.70)',
  hatch: 'rgba(255,255,255,0.12)',
} as const;

/**
 * Any colour a component may be handed. Typing a prop as `Ink` rather than
 * `string` is what stops a screen from passing a hex — tsc rejects it, so the
 * one-file rule is enforced by the compiler rather than by review.
 */
export type Ink = (typeof color)[keyof typeof color];
