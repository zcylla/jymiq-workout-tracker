export const ICON_NAMES = [
  'today',
  'session',
  'strength',
  'load',
  'search',
  'gear',
  'back',
  'plus',
  'cal',
  'dots',
  'start',
  'resume',
  'hist',
  'stat',
  'note',
  'swap',
  'chev',
  'up',
  'down',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/** Default render sizes, shared by the renderer and the icon gate. */
export const ICON_SIZE = {
  today: 22,
  session: 22,
  strength: 22,
  load: 22,
  search: 22,
  gear: 22,
  back: 22,
  plus: 22,
  cal: 22,
  dots: 22,
  /** Inside the tab bar's start button, on the accent fill. */
  start: 22,
  /** The same button while a session runs. */
  resume: 22,

  /** Lab 28's four live destinations, over their mono labels. */
  hist: 19,
  stat: 19,
  note: 19,
  swap: 19,

  /** In a list row and beside a field. */
  chev: 13,
  /** Inside a Delta, beside 13px mono. */
  up: 9,
  down: 9,
} as const satisfies Record<IconName, number>;

const NAV_STROKE = (1.6 * 24) / 22;

/**
 * Hugeicons uses a 24-unit box: on-screen stroke = strokeWidth * size / 24.
 * These preserve the old SVGs' stroke at every render size, including overrides:
 * nav 1.6pt, live 1.38pt, chevron 1.38125pt, delta 1.62pt, back 1.8pt, start 1.9pt.
 */
export const ICON_STROKE_WIDTH = {
  today: NAV_STROKE,
  session: NAV_STROKE,
  strength: NAV_STROKE,
  load: NAV_STROKE,
  search: NAV_STROKE,
  gear: 1.745,
  back: (1.8 * 24) / 22,
  plus: NAV_STROKE,
  cal: NAV_STROKE,
  dots: NAV_STROKE,
  start: (1.9 * 24) / 22,
  resume: (1.9 * 24) / 22,
  hist: NAV_STROKE,
  stat: NAV_STROKE,
  note: NAV_STROKE,
  swap: NAV_STROKE,
  chev: (1.7 * 24) / 16,
  up: (1.8 * 24) / 10,
  down: (1.8 * 24) / 10,
} as const satisfies Record<IconName, number>;
