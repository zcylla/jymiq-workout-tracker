import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { clampIndex, indexOf, valueAt, type Scale } from '@/lib/scale';
import { magnet, release, scrubIndex } from '@/lib/scrub';
import { color, lh, mono, size, text } from '@/theme';

import { pop, tick } from './haptics';

type Props = {
  scale: Scale;
  value: number;
  unit: string;
  /** Called once per crossed detent; the live row persists it immediately. */
  onDetent?: (value: number) => void;
  /** Visible detents, odd so one sits in the centre. A short screen shows fewer. */
  rows?: number;
  /** A finger held elsewhere drives the tape: its vertical travel while held, null otherwise. */
  scrubSV?: SharedValue<number | null>;
};

/**
 * A fixed centre index over a scale that moves: a slow drag clicks detent by
 * detent, a throw glides on, and either lands on a detent. Position is a float
 * index on the UI thread; every detent it crosses — dragged or coasting — ticks and
 * writes through `onDetent` exactly once.
 */
export function Tape({ scale, value, unit, onDetent, rows = 9, scrubSV }: Props) {
  const centre = (rows - 1) / 2;
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

  const settle = (velocity: number) => {
    'worklet';
    const { target, config } = release(scale, posSV.get(), velocity);
    posSV.set(
      withSpring(target, config, (finished) => {
        if (!finished) return;
        movingSV.set(false);
        if (target !== originSV.get()) scheduleOnRN(pop);
      }),
    );
  };

  // A held scrub moves detent by detent, so there is nothing to coast or settle.
  useAnimatedReaction(
    () => scrubSV?.get() ?? null,
    (dy, previous) => {
      if (dy == null) {
        if (previous == null) return;
        movingSV.set(false);
        if (clampIndex(scale, Math.round(posSV.get())) !== originSV.get()) scheduleOnRN(pop);
        return;
      }
      if (previous == null) {
        cancelAnimation(posSV);
        const at = clampIndex(scale, Math.round(posSV.get()));
        if (!movingSV.get()) originSV.set(at);
        movingSV.set(true);
        startSV.set(at);
        posSV.set(at);
      }
      posSV.set(scrubIndex(scale, startSV.get(), dy, size.tapeRow, posSV.get()));
    },
  );

  const pan = Gesture.Pan()
    .activeOffsetY([-4, 4])
    .failOffsetX([-16, 16])
    .onBegin(() => {
      if (scrubSV?.get() != null) return;
      // A touch catches a coasting tape where it is.
      cancelAnimation(posSV);
      if (!movingSV.get()) originSV.set(clampIndex(scale, Math.round(posSV.get())));
      movingSV.set(true);
      startSV.set(posSV.get());
    })
    .onUpdate((event) => {
      if (scrubSV?.get() != null) return;
      const raw = startSV.get() - event.translationY / size.tapeRow;
      const current = clampIndex(scale, Math.round(posSV.get()));
      posSV.set(magnet(scale, raw, current, -event.velocityY / size.tapeRow));
    })
    .onEnd((event, success) => {
      if (!success || scrubSV?.get() != null) return;
      settle(-event.velocityY / size.tapeRow);
    })
    .onFinalize((_event, success) => {
      if (!success && scrubSV?.get() == null) settle(0);
    });

  const strip = useAnimatedStyle(() => ({
    transform: [{ translateY: (centre - posSV.get()) * size.tapeRow }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: 72 }}>
        <Text style={[text.label, { marginBottom: 8, textAlign: 'right' }]}>{unit}</Text>
        <View style={{ height: size.tapeRow * rows, overflow: 'hidden' }}>
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
