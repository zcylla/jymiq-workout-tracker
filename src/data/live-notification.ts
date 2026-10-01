import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import {
  type LiveNotificationState,
  liveNotificationContent,
  nativeLiveNotificationContent,
} from '@/lib/live-notification';

import LiveRest from '../../modules/live-rest';
import type { RestAction } from '../../modules/live-rest';

const IDENTIFIER = 'live-workout';
const CHANNEL = 'session';
let pending = Promise.resolve();
let revision = 0;
let active = false;
let restActionsPending = 0;
let actionsPending = Promise.resolve();

export function listenForRestActions(
  apply: (actions: RestAction[]) => void,
  settled: () => void,
): () => void {
  if (LiveRest === null) {
    settled();
    return () => {};
  }
  const native = LiveRest;
  let mounted = true;
  const enqueue = (action?: RestAction) => {
    restActionsPending++;
    revision++;
    actionsPending = actionsPending.then(async () => {
      try {
        const actions = action ? [action] : await native.consumeRestActions();
        apply(actions);
      } catch {
      } finally {
        restActionsPending--;
        if (mounted) settled();
      }
    });
  };
  enqueue();
  let subscription: ReturnType<typeof native.addListener> | undefined;
  let appState: ReturnType<typeof AppState.addEventListener> | undefined;
  try {
    subscription = native.addListener('onRestAction', (action) => enqueue(action));
    appState = AppState.addEventListener('change', (status) => {
      if (status === 'active') enqueue();
    });
  } catch {}
  return () => {
    mounted = false;
    try {
      subscription?.remove();
      appState?.remove();
    } catch {}
  };
}

async function ensureChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Workout in progress',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    enableVibrate: false,
    vibrationPattern: [0],
    enableLights: false,
    showBadge: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

/** Asks for notification permission if it can still be asked; false when denied or unavailable. */
export async function askNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    await ensureChannel();
    const status = await Notifications.getPermissionsAsync();
    if (status.granted) return true;
    if (!status.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

async function canNotify(): Promise<boolean> {
  try {
    await ensureChannel();
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

async function cancelRestEnd(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(IDENTIFIER);
  } catch {}
}

async function dismiss(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(IDENTIFIER);
  } catch {}
}

function content(
  state: LiveNotificationState,
  nowMs: number,
): Notifications.NotificationContentInput {
  return {
    ...liveNotificationContent({ ...state, nowMs }),
    data: { route: '/live' },
    sticky: true,
    autoDismiss: false,
    sound: false,
    vibrate: [0],
    priority: 'low',
  };
}

export function updateLiveNotification(
  state: LiveNotificationState | null,
  restStartMs: number | null = null,
): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  active = state !== null;
  const requestedRevision = ++revision;
  pending = pending.then(async () => {
    try {
      if (requestedRevision !== revision || restActionsPending > 0) return;
      if (state === null) {
        await LiveRest?.hide();
        await cancelRestEnd();
        await dismiss();
        return;
      }
      if (!(await canNotify()) || requestedRevision !== revision) return;
      await cancelRestEnd();
      if (requestedRevision !== revision) return;
      if (LiveRest !== null) {
        await dismiss();
        if (requestedRevision !== revision) return;
        await LiveRest.show(nativeLiveNotificationContent(state, restStartMs));
        return;
      }
      await Notifications.scheduleNotificationAsync({
        identifier: IDENTIFIER,
        content: content(state, Date.now()),
        trigger: { channelId: CHANNEL },
      });
      if (requestedRevision !== revision) return;
      if (state.restUntil != null && state.restUntil > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          identifier: IDENTIFIER,
          content: content(state, state.restUntil),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: state.restUntil,
            channelId: CHANNEL,
          },
        });
      }
    } catch {}
  });
  return pending;
}

export function listenForLiveNotification(onOpen: () => void): () => void {
  if (Platform.OS !== 'android') return () => {};
  let mounted = true;
  let responseReceived = false;
  let subscription:
    | ReturnType<typeof Notifications.addNotificationResponseReceivedListener>
    | undefined;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => ({
        shouldShowBanner: false,
        shouldShowList: active && notification.request.identifier === IDENTIFIER,
        shouldPlaySound: false,
        shouldSetBadge: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
      }),
    });
  } catch {}
  const respond = (response: Notifications.NotificationResponse | null) => {
    try {
      if (
        !mounted ||
        !response ||
        response.notification.request.identifier !== IDENTIFIER ||
        response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
      )
        return;
      onOpen();
      void (async () => {
        try {
          await Notifications.clearLastNotificationResponseAsync();
        } catch {}
      })();
    } catch {}
  };
  try {
    subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      responseReceived = true;
      respond(response);
    });
  } catch {}
  void (async () => {
    try {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (!responseReceived) respond(response);
    } catch {}
  })();
  return () => {
    mounted = false;
    try {
      subscription?.remove();
    } catch {}
  };
}
