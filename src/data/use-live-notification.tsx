import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { liveNotificationContent, liveNotificationState } from '@/lib/live-notification';

import { useRows } from './live';
import {
  askNotificationPermission,
  listenForLiveNotification,
  updateLiveNotification,
} from './live-notification';
import { activeSessionQuery, sessionExercisesQuery, sessionSetsQuery } from './queries/sessions';
import { setSettings, useSettings } from './settings';

type Session = Awaited<ReturnType<typeof activeSessionQuery>>[number];

function useLiveNotification(session: Session): void {
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
    if (state === null) return;
    const rendered = liveNotificationContent({ ...state, nowMs: Date.now() });
    const signature = JSON.stringify([rendered.title, rendered.body, state.restUntil]);
    if (last.current === signature) return;
    last.current = signature;
    void updateLiveNotification(state);
  }, [state, refresh]);
}

function ActiveNotification({ session }: { session: Session }) {
  useLiveNotification(session);
  return null;
}

function NotificationObserver() {
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
  }, [noSession, liveNotification]);
  const session = sessions?.[0];
  return session && ready && liveNotification ? (
    <ActiveNotification key={session.id} session={session} />
  ) : null;
}

export function LiveNotification() {
  return Platform.OS === 'android' ? <NotificationObserver /> : null;
}
