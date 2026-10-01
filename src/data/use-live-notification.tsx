import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import {
  type NotificationRest,
  liveNotificationContent,
  liveNotificationState,
  observeNotificationRest,
} from '@/lib/live-notification';

import { useRows } from './live';
import {
  askNotificationPermission,
  listenForLiveNotification,
  listenForRestActions,
  updateLiveNotification,
} from './live-notification';
import { clearRest, extendRest, shortenRest } from './mutations/sessions';
import { activeSessionQuery, sessionExercisesQuery, sessionSetsQuery } from './queries/sessions';
import { setSettings, useSettings } from './settings';

type Session = Awaited<ReturnType<typeof activeSessionQuery>>[number];

function useLiveNotification(session: Session, actionsRevision: number): void {
  const exercises = useRows(
    useMemo(() => sessionExercisesQuery(session.id), [session.id]),
    [session.id],
  );
  const sets = useRows(
    useMemo(() => sessionSetsQuery(session.id), [session.id]),
    [session.id],
  );
  const { weightUnit } = useSettings();
  const [refresh, wake] = useReducer((value: number) => value + 1, 0);
  const last = useRef<string | null>(null);
  const rest = useRef<NotificationRest | null>(null);
  const state = useMemo(
    () =>
      exercises === null || sets === null
        ? null
        : liveNotificationState(session, exercises, sets, weightUnit),
    [session, exercises, sets, weightUnit],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') wake();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (session.restUntil == null) return;
    const remaining = session.restUntil - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(wake, Math.min(remaining, 2_147_483_647));
    return () => clearTimeout(timer);
  }, [session.restUntil, refresh]);

  useEffect(() => {
    try {
      if (state === null) return;
      const current = activeSessionQuery().all()[0];
      if (current?.id !== session.id) return;
      const latest = { ...state, restUntil: current.restUntil };
      rest.current = observeNotificationRest(
        rest.current,
        latest.restUntil,
        Date.now(),
        latest.restKey,
      );
      const rendered = liveNotificationContent({ ...latest, nowMs: Date.now() });
      const signature = JSON.stringify([
        rendered.title,
        rendered.body,
        latest.restUntil,
        latest.restKey,
        actionsRevision,
      ]);
      if (last.current === signature) return;
      last.current = signature;
      void updateLiveNotification(latest, rest.current?.startMs ?? null);
    } catch {}
  }, [state, session.id, refresh, actionsRevision]);
}

function ActiveNotification({
  session,
  actionsRevision,
}: {
  session: Session;
  actionsRevision: number;
}) {
  useLiveNotification(session, actionsRevision);
  return null;
}

function NotificationObserver() {
  const [actionsRevision, actionsSettled] = useReducer((value: number) => value + 1, 0);
  useEffect(
    () =>
      listenForRestActions((actions) => {
        for (const action of actions) {
          try {
            const session = activeSessionQuery().all()[0];
            if (session?.restUntil == null) continue;
            if (action.type === 'plus') extendRest(session.id, 30);
            else if (action.type === 'minus') shortenRest(session.id, 30);
            else if (action.type === 'skip') clearRest(session.id);
          } catch {}
        }
      }, actionsSettled),
    [],
  );
  const { liveNotification: setting } = useSettings();
  const liveNotification = setting === true;
  useEffect(() => {
    if (setting !== null) return;
    void askNotificationPermission().then((granted) => setSettings({ liveNotification: granted }));
  }, [setting]);
  const sessions = useRows(
    useMemo(() => activeSessionQuery(), []),
    [],
  );
  const navigation = useRootNavigationState();
  const ready = Boolean(navigation?.key);
  const noSession = sessions !== null && sessions.length === 0;
  useEffect(() => {
    if (!ready) return;
    return listenForLiveNotification(() => router.push('/live'));
  }, [ready]);
  useEffect(() => {
    if (noSession || !liveNotification) void updateLiveNotification(null);
  }, [noSession, liveNotification, actionsRevision]);
  const session = sessions?.[0];
  return session && ready && liveNotification && actionsRevision > 0 ? (
    <ActiveNotification key={session.id} session={session} actionsRevision={actionsRevision} />
  ) : null;
}

export function LiveNotification() {
  return Platform.OS === 'android' ? <NotificationObserver /> : null;
}
