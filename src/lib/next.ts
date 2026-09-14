/**
 * Which routine Today offers to start.
 *
 * **This is a heuristic standing in for a schedule, not a schedule.** §0's IA
 * gives Today "the next routine", and programs (Lab 34 A3/A4) are what will
 * eventually answer that — a table resolving a weekday or a cycle position to a
 * routine. Nothing stores one yet, so the honest substitute is the routine you
 * have trained *least recently*: it is the one that is due, it needs no invented
 * schedule, and it degrades correctly to "the first one" on a fresh install.
 * Replace this wholesale when programs land; do not grow it.
 */

export interface PickableRoutine {
  id: string;
  name: string;
  position: number;
}

export interface NextRoutine<T extends PickableRoutine> {
  routine: T;
  /** Null when this routine has never been run. */
  lastRunAt: number | null;
}

export function pickNextRoutine<T extends PickableRoutine>(
  routines: readonly T[],
  lastRunByRoutine: ReadonlyMap<string, number>,
): NextRoutine<T> | null {
  let best: NextRoutine<T> | null = null;

  for (const routine of routines) {
    const lastRunAt = lastRunByRoutine.get(routine.id) ?? null;
    if (best === null) {
      best = { routine, lastRunAt };
      continue;
    }
    // Never-run wins outright; otherwise the older last run wins. `position` is
    // the tie-break, and it arrives already sorted, so only a strict improvement
    // displaces the incumbent.
    if (best.lastRunAt === null) continue;
    if (lastRunAt === null || lastRunAt < best.lastRunAt) best = { routine, lastRunAt };
  }

  return best;
}

/** `"LAST RUN 5 DAYS AGO"`, and what the card's kicker says before there is one. */
export function lastRunLabel(lastRunAt: number | null, now: number = Date.now()): string {
  if (lastRunAt === null) return 'NEVER RUN';
  const days = Math.floor((now - lastRunAt) / 86_400_000);
  if (days <= 0) return 'LAST RUN TODAY';
  if (days === 1) return 'LAST RUN YESTERDAY';
  return `LAST RUN ${days} DAYS AGO`;
}
