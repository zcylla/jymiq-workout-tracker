import { type ReactNode, useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { heading, inEdgeBand, rubberBand, type Swipe, swipeIntent } from '@/lib/pager';
import { motion } from '@/theme';

import { gestureEnd, gestureStart, tick } from './haptics';

/** A page follows the finger at this fraction of its travel. */
const RESIST = 0.8;
/** How far a page travels, as a fraction of the width, on its way out and in. */
const TRAVEL = 0.4;
/** Both axes arm at this many points; whichever is further along when it arms owns the drag. */
const ARM = 12;
/** If the cursor write has not come back as a new page by now, the old one returns. */
const STUCK_MS = 400;

const SNAP = { damping: 20, stiffness: 260, mass: 0.7 };
const LEAVE = { duration: motion.fast, easing: Easing.in(Easing.quad) };
const ARRIVE = { duration: motion.base, easing: Easing.out(Easing.cubic) };

type Props = {
  /** Changes when the page on screen changes: the incoming page slides in on it. */
  pageKey: string;
  /** Where there is somewhere to go. A closed direction rubber-bands and bounces. */
  can: Record<Swipe, boolean>;
  disabled: boolean;
  onSwipe: (swipe: Swipe) => void;
  children: ReactNode;
};

/** Enter from the side opposite the one the last page left by. */
function enter(
  xSV: SharedValue<number>,
  ySV: SharedValue<number>,
  fadeSV: SharedValue<number>,
  outSV: SharedValue<{ x: number; y: number } | null>,
) {
  const out = outSV.get();
  if (!out) return;
  outSV.set(null);
  xSV.set(withSequence(withTiming(-out.x, { duration: 0 }), withTiming(0, ARRIVE)));
  ySV.set(withSequence(withTiming(-out.y, { duration: 0 }), withTiming(0, ARRIVE)));
  fadeSV.set(withTiming(1, ARRIVE));
}

/**
 * The live screen's four-way pager (§0: horizontal = sets, vertical = exercises).
 * It never navigates itself: it plays the motion and asks `onSwipe`, and the
 * incoming page arrives as a new `pageKey` once the cursor write lands.
 *
 * The Android rules from `dev/gestures.tsx`: a swipe that starts within 40dp of
 * either edge is left to the system, and a cancelled swipe snaps back and never
 * commits.
 */
export function LivePager({ pageKey, can, disabled, onSwipe, children }: Props) {
  const { width } = useWindowDimensions();
  const xSV = useSharedValue(0);
  const ySV = useSharedValue(0);
  const fadeSV = useSharedValue(1);
  /** 0 before the drag arms, then 1 for horizontal or 2 for vertical. */
  const axisSV = useSharedValue(0);
  const ignoredSV = useSharedValue(false);
  const outSV = useSharedValue<{ x: number; y: number } | null>(null);

  useEffect(() => {
    enter(xSV, ySV, fadeSV, outSV);
  }, [pageKey, xSV, ySV, fadeSV, outSV]);

  const commit = (swipe: Swipe) => {
    tick();
    onSwipe(swipe);
    setTimeout(() => enter(xSV, ySV, fadeSV, outSV), STUCK_MS);
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-ARM, ARM])
    .activeOffsetY([-ARM, ARM])
    .onBegin((e) => {
      ignoredSV.set(inEdgeBand(e.absoluteX, width));
    })
    .onStart(() => {
      if (!ignoredSV.get()) scheduleOnRN(gestureStart);
    })
    .onUpdate((e) => {
      if (ignoredSV.get()) return;
      let axis = axisSV.get();
      // Decided on the first move, not in onStart: its event reports a zero translation on Android.
      if (axis === 0) {
        if (e.translationX === 0 && e.translationY === 0) return;
        axis = Math.abs(e.translationX) >= Math.abs(e.translationY) ? 1 : 2;
        axisSV.set(axis);
      }
      const t = axis === 1 ? e.translationX : e.translationY;
      const moved = can[heading(axis === 1 ? 'x' : 'y', t)] ? t * RESIST : rubberBand(t, width);
      if (axis === 1) xSV.set(moved);
      else ySV.set(moved);
      fadeSV.set(1 - Math.min(Math.abs(moved) / width, 0.6));
    })
    .onEnd((e, success) => {
      const axis = axisSV.get();
      if (axis === 0) return;
      const horizontal = axis === 1;
      const t = horizontal ? e.translationX : e.translationY;
      const v = horizontal ? e.velocityX : e.velocityY;
      const swipe = success ? swipeIntent(horizontal ? 'x' : 'y', t, v, width) : null;

      if (swipe && can[swipe]) {
        const out = Math.sign(t) * width * TRAVEL;
        outSV.set(horizontal ? { x: out, y: 0 } : { x: 0, y: out });
        (horizontal ? xSV : ySV).set(
          withTiming(out, LEAVE, (finished) => {
            if (finished) scheduleOnRN(commit, swipe);
          }),
        );
        fadeSV.set(withTiming(0, LEAVE));
        return;
      }

      // An end with nowhere to go: the bounce is the answer, and it gets a haptic.
      if (swipe) scheduleOnRN(gestureEnd);
      xSV.set(withSpring(0, { ...SNAP, velocity: horizontal ? v : 0 }));
      ySV.set(withSpring(0, { ...SNAP, velocity: horizontal ? 0 : v }));
      fadeSV.set(withTiming(1, { duration: motion.fast }));
    })
    .onFinalize(() => {
      axisSV.set(0);
    });

  const style = useAnimatedStyle(() => ({
    opacity: fadeSV.get(),
    transform: [{ translateX: xSV.get() }, { translateY: ySV.get() }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>
      </View>
    </GestureDetector>
  );
}
