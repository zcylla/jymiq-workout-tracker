import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { type LiveNotificationState, liveNotificationContent } from '@/lib/live-notification';

const IDENTIFIER = 'live-workout';
const CHANNEL = 'session';
let permission: Promise<boolean> | undefined;
let pending = Promise.resolve();
let revision = 0;
let active = false;

async function allowNotifications(): Promise<boolean> {
  try {
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
    const status = await Notifications.getPermissionsAsync();
    if (status.granted) return true;
    if (!status.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
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

export function updateLiveNotification(state: LiveNotificationState | null): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  active = state !== null;
  const requestedRevision = ++revision;
  pending = pending.then(async () => {
    try {
      if (requestedRevision !== revision) return;
      if (state === null) {
        await cancelRestEnd();
        await dismiss();
        return;
      }
      permission ??= allowNotifications();
      if (!(await permission) || requestedRevision !== revision) return;
      await cancelRestEnd();
      if (requestedRevision !== revision) return;
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
