import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { color, motion, radius, text } from '@/theme';

import { gestureEnd, gestureStart } from './haptics';

type Props = {
  children: ReactNode;
  /** Swipe left. Draws the red DELETE backdrop; omitted, the direction is inert. */
  onDelete?: () => void;
  /** Swipe right. Draws the SWAP backdrop; omitted, the direction is inert. */
  onSwap?: () => void;
};

/** Fraction of the row's width past which a release commits. */
const COMMIT = 0.45;
/** A release faster than this (pt/s), after at least MIN_FLING of travel, commits early. */
const FLING = 900;
const MIN_FLING = 48;
/** How long a committed row waits off-screen for its parent to remove it before coming back. */
const RETURN_AFTER = 450;

const LABEL_PAD = 16;

/**
 * A row you can swipe sideways. Nothing is left revealed: past the threshold
 * the row leaves and the callback fires; short of it the row springs home.
 */
export function SwipeRow({ children, onDelete, onSwap }: Props) {
  const xSV = useSharedValue(0);
  const widthSV = useSharedValue(0);
  const crossedSV = useSharedValue(false);

  const canDelete = onDelete != null;
  const canSwap = onSwap != null;
  const fireDelete = () => onDelete?.();
  const fireSwap = () => onSwap?.();

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      const w = widthSV.get();
      const x = Math.min(canSwap ? w : 0, Math.max(canDelete ? -w : 0, event.translationX));
      xSV.set(x);
      const past = Math.abs(x) >= w * COMMIT;
      if (past !== crossedSV.get()) {
        crossedSV.set(past);
        if (past) scheduleOnRN(gestureStart);
      }
    })
    .onEnd((event, success) => {
      const w = widthSV.get();
      const x = xSV.get();
      const dir = x < 0 ? -1 : 1;
      const fling =
        Math.abs(event.velocityX) > FLING &&
        Math.abs(x) > MIN_FLING &&
        Math.sign(event.velocityX) === dir;
      if (success && (Math.abs(x) >= w * COMMIT || fling)) {
        xSV.set(
          withTiming(dir * w, { duration: motion.fast }, (finished) => {
            if (!finished) return;
            scheduleOnRN(gestureEnd);
            scheduleOnRN(dir < 0 ? fireDelete : fireSwap);
            xSV.set(withDelay(RETURN_AFTER, withTiming(0, { duration: motion.base })));
          }),
        );
      } else {
        xSV.set(withSpring(0, { damping: 28, stiffness: 340 }));
      }
    })
    .onFinalize(() => {
      crossedSV.set(false);
    });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: xSV.get() }] }));
  const deleteStyle = useAnimatedStyle(() => {
    const x = xSV.get();
    return { opacity: x < 0 ? interpolate(-x, [0, widthSV.get() * COMMIT], [0.5, 1], 'clamp') : 0 };
  });
  const swapStyle = useAnimatedStyle(() => {
    const x = xSV.get();
    return { opacity: x > 0 ? interpolate(x, [0, widthSV.get() * COMMIT], [0.5, 1], 'clamp') : 0 };
  });

  if (!canDelete && !canSwap) return <>{children}</>;

  return (
    <View
      style={{ overflow: 'hidden', borderRadius: radius.row }}
      onLayout={(e) => widthSV.set(e.nativeEvent.layout.width)}
    >
      {canDelete ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            deleteStyle,
            { backgroundColor: color.live, justifyContent: 'center', alignItems: 'flex-end' },
          ]}
        >
          <Text style={[text.label, { color: color.hi, marginRight: LABEL_PAD }]}>DELETE</Text>
        </Animated.View>
      ) : null}
      {canSwap ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            swapStyle,
            { backgroundColor: color.raised, justifyContent: 'center', alignItems: 'flex-start' },
          ]}
        >
          <Text style={[text.label, { color: color.accent, marginLeft: LABEL_PAD }]}>SWAP</Text>
        </Animated.View>
      ) : null}
      <GestureDetector gesture={pan}>
        <Animated.View style={[rowStyle, { backgroundColor: color.panel }]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
