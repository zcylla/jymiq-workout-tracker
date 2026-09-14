import { useMemo } from 'react';

import { dayKey } from '@/lib/calendar';
import { NO_SCHEDULE, type Schedule } from '@/lib/program';

import { useRows } from './live';
import { activeProgramQuery, programDaysQuery } from './queries/programs';
import type { Program } from './schema';

export interface ScheduledRoutine {
  id: string;
  name: string;
}

export interface ActiveSchedule {
  /** Null when nothing is running. The schedule is then empty, not absent. */
  program: Program | null;
  schedule: Schedule<ScheduledRoutine>;
}

/**
 * The running program's weekday schedule — what Today, the week strip and the
 * calendar all read to tell a missed day from a rest day.
 *
 * `null` until both queries have answered (see `useRows`). Treating an unloaded
 * schedule as an empty one would draw every past training day as rest for a
 * frame and then flip it to missed, which is a lapse appearing out of nowhere.
 *
 * Two subscriptions rather than one join: `useLiveQuery` only watches the table
 * in the query's `FROM`, so the program row and its days each need their own.
 */
export function useActiveSchedule(): ActiveSchedule | null {
  const found = useRows(
    useMemo(() => activeProgramQuery(), []),
    [],
  );
  const program = found?.[0] ?? null;

  const days = useRows(
    useMemo(() => programDaysQuery(program?.id ?? ''), [program?.id]),
    [program?.id],
  );

  return useMemo(() => {
    if (found === null) return null;
    if (program === null) return { program: null, schedule: NO_SCHEDULE };
    if (days === null) return null;
    const map = new Map<number, ScheduledRoutine>();
    for (const day of days) map.set(day.weekday, { id: day.routineId, name: day.name });
    return {
      program,
      schedule: {
        days: map,
        since: program.startedAt === null ? null : dayKey(program.startedAt),
      },
    };
  }, [found, program, days]);
}
