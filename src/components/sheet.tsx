import { type ReactNode, useEffect, useLayoutEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import {
  color,
  controlEdgeDense,
  controlSheetBlur,
  hairline,
  motion,
  radius,
  space,
  wash,
} from '@/theme';

import { GlassUnder, glassStyle } from './glass';
import { useFloatingBlurTarget, useSheetOpenRegistration } from './screen-blur';

/**
 * The shared shell for every overlay on the live screen (sets, exercises, the
 * keypad).
 *
 * `@expo/ui`'s native `BottomSheet` was tried here first and rejected on the
 * device: it renders and lays out, but **no touch reaches any React Native
 * child inside it** — every row and both footer buttons were inert. It also
 * measures children against an unbounded width, so a row of fixed columns and
 * a flex spacer collapsed short of the right edge. Neither shows up in a
 * type-check, a lint, or a screenshot of the closed state.
 *
 * So the scrim, the panel and the dismiss are ours. Back is handled by the
 * screen rather than here, because it has to close a sheet *before* it reaches
 * the session-discard confirm, and one handler that knows both is clearer than
 * two that race.
 *
 * Opening slides the panel up over a fading scrim (`motion.base`, ease-out);
 * closing runs it back (`motion.fast`, ease-in) and only then unmounts, so the
 * exit is seen. Dragging the handle down past a third of the panel, or flinging
 * it, dismisses; short of that it springs back.
 */

/** Fraction of the panel's height a release must pass to dismiss. */
const DISMISS_FRACTION = 0.3;
/** A downward fling (pt/s) that dismisses regardless of distance, past MIN_FLING_DRAG. */
const DISMISS_VELOCITY = 800;
const MIN_FLING_DRAG = 24;

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();
  const panelHSV = useSharedValue(height);
  const [presence, setPresence] = useState({ open, mounted: open });
  if (presence.open !== open) setPresence({ open, mounted: presence.mounted || open });
  return presence.mounted ? (
    <SheetBody
      panelHSV={panelHSV}
      open={open}
      onClose={onClose}
      onExited={() =>
        setPresence((current) => (current.open ? current : { ...current, mounted: false }))
      }
    >
      {children}
    </SheetBody>
  ) : null;
}

function SheetBody({
  open,
  onClose,
  onExited,
  children,
  panelHSV,
}: {
  open: boolean;
  onClose: () => void;
  onExited: () => void;
  panelHSV: SharedValue<number>;
  children: ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const target = useFloatingBlurTarget();
  const registerSheetOpen = useSheetOpenRegistration();
  const progressSV = useSharedValue(0);
  const dragYSV = useSharedValue(0);
  const openSV = useSharedValue(open);

  useEffect(() => registerSheetOpen?.(), [registerSheetOpen]);

  useLayoutEffect(() => {
    const exit = () => {
      if (!openSV.get() && progressSV.get() === 0) onExited();
    };
    openSV.set(open);
    if (open) {
      dragYSV.set(0);
      progressSV.set(withTiming(1, { duration: motion.base, easing: Easing.out(Easing.cubic) }));
    } else {
      progressSV.set(
        withTiming(0, { duration: motion.fast, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) scheduleOnRN(exit);
        }),
      );
    }
    return () => {
      cancelAnimation(progressSV);
      cancelAnimation(dragYSV);
    };
  }, [open, dragYSV, openSV, progressSV, onExited]);

  const android = Platform.OS === 'android';
  const pan = Gesture.Pan()
    .activeOffsetY([-4, 4])
    .failOffsetX([-24, 24])
    .hitSlop({ top: 14 })
    .onUpdate((event) => {
      dragYSV.set(Math.max(0, event.translationY));
    })
    .onEnd((event, success) => {
      const h = panelHSV.get();
      const y = dragYSV.get();
      const dismiss =
        success &&
        (y > h * DISMISS_FRACTION || (event.velocityY > DISMISS_VELOCITY && y > MIN_FLING_DRAG));
      if (dismiss) {
        progressSV.set(1 - Math.min(y / h, 1));
        dragYSV.set(0);
        scheduleOnRN(onClose);
      } else {
        dragYSV.set(withSpring(0, { damping: 28, stiffness: 340 }));
      }
    })
    .onFinalize((_event, success) => {
      if (!android || success) return;
      dragYSV.set(withSpring(0, { damping: 28, stiffness: 340 }));
    });

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progressSV.get() * (1 - Math.min(dragYSV.get() / panelHSV.get(), 1)),
  }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progressSV.get()) * panelHSV.get() + dragYSV.get() }],
  }));

  return (
    // Edge-to-edge Android never resizes the window for the keyboard, so a sheet
    // holding a field has to lift itself or the keyboard covers it.
    <KeyboardAvoidingView
      behavior="padding"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Animated.View style={[{ flex: 1 }, scrimStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={{ flex: 1, backgroundColor: wash.scrim }}
        />
      </Animated.View>
      <Animated.View
        onLayout={(e) => panelHSV.set(e.nativeEvent.layout.height)}
        style={[
          {
            width,
            maxHeight: height * 0.8,
            ...(target
              ? {
                  ...glassStyle(controlSheetBlur, controlSheetBlur.blur),
                  borderWidth: controlEdgeDense.borderWidth,
                  borderColor: 'transparent',
                }
              : { ...controlEdgeDense, backgroundColor: color.raised }),
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            borderCurve: 'continuous',
            paddingBottom: Math.max(insets.bottom, space.within),
          },
          panelStyle,
        ]}
      >
        {target ? (
          <GlassUnder
            recipe={controlSheetBlur}
            blur={controlSheetBlur.blur}
            target={target}
            radius={{ borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet }}
          />
        ) : null}
        <GestureDetector gesture={pan}>
          <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 12 }}>
            <View
              style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: hairline.onPlate }}
            />
          </View>
        </GestureDetector>
        <ScrollView
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: space.pad, paddingBottom: space.within }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
