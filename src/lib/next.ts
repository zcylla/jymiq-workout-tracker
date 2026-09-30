import { dateLabel } from './time.ts';

/**
 * What Today's card says about the routine the schedule offers next.
 *
 * **The schedule is the answer now.** This file used to hold
 * `pickNextRoutine` — "the routine trained least recently" — an explicit
 * stand-in for a schedule nothing stored. Programs (Lab 34 A3/A4) store one, so
 * the heuristic is gone rather than kept as a fallback: two rules for what
 * "next" means is how the card ends up disagreeing with the week strip beside it.
 * With no program running there is no next, and the card offers only MAKE A PROGRAM.
 */

/** `"TODAY"` · `"TOMORROW"` · `"FRI 19 SEP"` — the card's kicker. */
export function dueLabel(daysAway: number, atMs: number): string {
  if (daysAway <= 0) return 'TODAY';
  if (daysAway === 1) return 'TOMORROW';
  return dateLabel(atMs).toUpperCase();
}

/** `"3D"` — days since the routine last ran; `"NEW"` before it ever has. */
export function lastRunLabel(lastRunAt: number | null, now: number = Date.now()): string {
  if (lastRunAt === null) return 'NEW';
  return `${Math.max(0, Math.floor((now - lastRunAt) / 86_400_000))}D`;
}

/** `"TODAY"` · `"TOMORROW"` on their own; `"FRI 19 SEP · 3D"` where the date does not already say how far off it is. */
export function nextKicker(
  daysAway: number,
  atMs: number,
  lastRunAt: number | null,
  now: number = Date.now(),
): string {
  const due = dueLabel(daysAway, atMs);
  return daysAway <= 1 ? due : `${due} · ${lastRunLabel(lastRunAt, now)}`;
}
