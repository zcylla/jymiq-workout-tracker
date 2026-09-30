/**
 * The size each icon is drawn at, which is also its default.
 *
 * Every icon is authored in its own square box, sized to suit where it is used —
 * so the box only makes sense at one render size. A 10-unit arrow blown up to
 * 22pt carries a 4pt stroke and dwarfs the 22-unit icons beside it. Making the
 * drawn size the default is what stops that happening by accident.
 *
 * `scripts/check-icons.mjs` reads this to verify each icon's on-screen stroke
 * width, so it is one list rather than two that drift.
 */
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

  /** Lab 28's four live destinations, over their mono labels — 1.6 in 22 reads 1.38pt, the board's weight. */
  hist: 19,
  stat: 19,
  note: 19,
  swap: 19,

  /** In a list row and beside a field. */
  chev: 13,
  /** Inside a Delta, beside 13px mono. */
  up: 9,
  down: 9,
} as const;
