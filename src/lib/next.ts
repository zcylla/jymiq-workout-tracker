import { dateLabel } from './time.ts';

/**
 * What Today's card says about the routine the schedule offers next.
 *
 * **The schedule is the answer now.** This file used to hold
 * `pickNextRoutine` — "the routine trained least recently" — an explicit
 * stand-in for a schedule nothing stored. Programs (Lab 34 A3/A4) store one, so
 * the heuristic is gone rather than kept as a fallback: two rules for what
 * "next" means is how the card ends up disagreeing with the week strip beside it.
 * With no program running there is no next, and the card says so.
 */

/** `"TODAY"` · `"TOMORROW"` · `"FRI 19 SEP"` — the card's kicker. */
export function dueLabel(daysAway: number, atMs: number): string {
  if (daysAway <= 0) return 'TODAY';
  if (daysAway === 1) return 'TOMORROW';
  return dateLabel(atMs).toUpperCase();
}

/** `"LAST RUN 5 DAYS AGO"`, and what the card says before there is one. */
export function lastRunLabel(lastRunAt: number | null, now: number = Date.now()): string {
  if (lastRunAt === null) return 'NEVER RUN';
  const days = Math.floor((now - lastRunAt) / 86_400_000);
  if (days <= 0) return 'LAST RUN TODAY';
  if (days === 1) return 'LAST RUN YESTERDAY';
  return `LAST RUN ${days} DAYS AGO`;
}
