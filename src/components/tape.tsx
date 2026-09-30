import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { clampIndex, indexOf, valueAt, type Scale } from '@/lib/scale';
import { color, lh, mono, size, text } from '@/theme';

import { pop, tick } from './haptics';

type Props = {
  scale: Scale;
  value: number;
  unit: string;
  /** Called once per crossed detent; the live row persists it immediately. */
  onDetent?: (value: number) => void;
};

const ROWS = 9;
const CENTRE = 4;
/** Lab 06 tile 02: underdamped on purpose — the overshoot is what reads as mechanical. */
const SETTLE = { damping: 26, stiffness: 220, mass: 0.6 };

/**
 * A fixed centre index over a scale that moves: drag it by detent, throw it and
 * it decays, then springs onto the nearest detent. Position is a float index on
 * the UI thread; every detent it crosses — dragged or coasting — ticks and
 * writes through `onDetent` exactly once.
 */
export function Tape({ scale, value, unit, onDetent }: Props) {
  const active = indexOf(scale, value);
  const posSV = useSharedValue(active);
  const startSV = useSharedValue(active);
  const originSV = useSharedValue(active);
  /** True from touch-down until the settle spring lands. */
  const movingSV = useSharedValue(false);

  // Every detent writes through `onDetent`, so `value` comes back changed while
  // the tape is still moving. Re-seeding from it then would fight the gesture;
  // this only resyncs between gestures (the keypad, another route).
  useEffect(() => {
    if (movingSV.get()) return;
    posSV.set(active);
  }, [active, movingSV, posSV]);

  useAnimatedReaction(
    () => clampIndex(scale, Math.round(posSV.get())),
    (index, previous) => {
      if (previous === null || index === previous || !movingSV.get()) return;
      scheduleOnRN(tick);
      if (onDetent) scheduleOnRN(onDetent, valueAt(scale, index));
    },
  );

  const settle = () => {
    'worklet';
    const target = clampIndex(scale, Math.round(posSV.get()));
    posSV.set(
      withSpring(target, SETTLE, (finished) => {
        if (!finished) return;
        movingSV.set(false);
        if (target !== originSV.get()) scheduleOnRN(pop);
      }),
    );
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-4, 4])
    .failOffsetX([-16, 16])
    .onBegin(() => {
      // A touch catches a coasting tape where it is.
      cancelAnimation(posSV);
      if (!movingSV.get()) originSV.set(clampIndex(scale, Math.round(posSV.get())));
      movingSV.set(true);
      startSV.set(posSV.get());
    })
    .onUpdate((event) => {
      const next = startSV.get() - event.translationY / size.tapeRow;
      posSV.set(Math.min(Math.max(next, 0), scale.n - 1));
    })
    .onEnd((event, success) => {
      if (!success) return;
      posSV.set(
        withDecay(
          { velocity: -event.velocityY / size.tapeRow, clamp: [0, scale.n - 1] },
          (finished) => {
            if (finished) settle();
          },
        ),
      );
    })
    .onFinalize((_event, success) => {
      if (!success) settle();
    });

  const strip = useAnimatedStyle(() => ({
    transform: [{ translateY: (CENTRE - posSV.get()) * size.tapeRow }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: 72 }}>
        <Text style={[text.label, { marginBottom: 8, textAlign: 'right' }]}>{unit}</Text>
        <View style={{ height: size.tapeRow * ROWS, overflow: 'hidden' }}>
          <Animated.View style={strip}>
            {Array.from({ length: scale.n }, (_, index) => {
              const distance = index - active;
              const isActive = distance === 0;
              const even = distance % 2 === 0;
              const tickWidth = isActive ? 15 : even ? 11 : 7;
              const tickHeight = isActive ? 2 : 1;

              return (
                <View
                  key={index}
                  style={{
                    height: size.tapeRow,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 7,
                  }}
                >
                  <Text
                    style={{
                      ...mono(isActive ? 600 : 400),
                      fontSize: isActive ? 16 : 13,
                      lineHeight: lh(isActive ? 16 : 13),
                      color: isActive ? color.hi : even ? color.lo : color.dim,
                    }}
                  >
                    {valueAt(scale, index)}
                  </Text>
                  <View
                    style={{
                      width: tickWidth,
                      height: tickHeight,
                      borderRadius: 1,
                      backgroundColor: isActive ? color.accent : color.tick2,
                    }}
                  />
                </View>
              );
            })}
          </Animated.View>
        </View>
      </View>
    </GestureDetector>
  );
}
