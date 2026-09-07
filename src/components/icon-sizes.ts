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
  /** In a list row and beside a field. */
  chev: 13,
  /** Inside a Delta, beside 13px mono. */
  up: 9,
  down: 9,
} as const;
