import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const TICK_GAP_MS = 25;
let lastTick = 0;

function fire(android: Haptics.AndroidHaptics, ios: () => Promise<void>) {
  try {
    const run =
      Platform.OS === 'android'
        ? Haptics.performAndroidHapticsAsync(android)
        : Platform.OS === 'ios'
          ? ios()
          : null;
    run?.catch(() => {});
  } catch {}
}

/** A detent crossed while scrubbing. Throttled so a fast fling does not stack. */
export function tick() {
  const now = Date.now();
  if (now - lastTick < TICK_GAP_MS) return;
  lastTick = now;
  fire(Haptics.AndroidHaptics.Segment_Tick, () => Haptics.selectionAsync());
}

/** A keypad key. */
export function key() {
  fire(Haptics.AndroidHaptics.Keyboard_Tap, () => Haptics.selectionAsync());
}

/** A value committed, a set logged, a switch flipped. */
export function pop() {
  fire(Haptics.AndroidHaptics.Confirm, () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  );
}

export function gestureStart() {
  fire(Haptics.AndroidHaptics.Gesture_Start, () => Haptics.selectionAsync());
}

export function gestureEnd() {
  fire(Haptics.AndroidHaptics.Gesture_End, () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  );
}
