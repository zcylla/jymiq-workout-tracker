import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { nextScheduled } from '@/lib/program';

import { startSession } from './mutations/sessions';
import { routineExercisesQuery } from './queries/routines';
import { useSessionRunning } from './running';
import { useActiveSchedule } from './schedule';

/**
 * The one way into a workout: resume what is running; otherwise start the
 * running program's next scheduled routine; otherwise start an empty session.
 * Today's Start and the tab bar's centre button both come through here.
 *
 * A routine with no lifts cannot be started as itself, so it falls through to an
 * empty session. The lifts are read at tap time, not from a subscription, so the
 * answer is never a stale or unloaded one.
 *
 * A tap while the running state or schedule is still `null` is ignored: acting
 * on a query that has not answered is how a second session gets started.
 */
export function useStartSession(): () => void {
  const running = useSessionRunning();
  const active = useActiveSchedule();
  const latest = useRef({ running, active });
  useEffect(() => {
    latest.current = { running, active };
  }, [running, active]);

  return useCallback(() => {
    const { running, active } = latest.current;
    if (running === null) return;
    if (running === false) {
      if (active === null) return;
      const next = nextScheduled(active.schedule);
      const routineId =
        next && routineExercisesQuery(next.routine.id).all().length > 0
          ? next.routine.id
          : undefined;
      try {
        startSession({ routineId });
      } catch {
        // Another start won the race; what is running is the place to be.
      }
    }
    router.replace('/live');
  }, []);
}
