import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { clampIndex, indexOf, valueAt, type Scale } from '@/lib/scale';
import { color, lh, mono, size, text } from '@/theme';

type Props = {
  scale: Scale;
  value: number;
  unit: string;
  /** Called once per crossed detent; the live row persists it immediately. */
  onDetent?: (value: number) => void;
};

/** A fixed, nine-detent readout with a vertical, detented pan. */
export function Tape({ scale, value, unit, onDetent }: Props) {
  const active = indexOf(scale, value);
  const startIndexSV = useSharedValue(active);
  const lastIndexSV = useSharedValue(active);
  const draggingSV = useSharedValue(false);

  // Every detent writes through `onDetent`, so `value` comes back changed while
  // the finger is still down. Re-seeding the origin from it mid-drag would
  // measure the same `translationY` against a moving start and the tape would
  // run away — one detent of travel, two detents of movement. The origin is
  // captured once, in onBegin, and this only resyncs between gestures.
  useEffect(() => {
    if (draggingSV.get()) return;
    startIndexSV.set(active);
    lastIndexSV.set(active);
  }, [active, draggingSV, lastIndexSV, startIndexSV]);

  const pan = Gesture.Pan()
    .activeOffsetY([-4, 4])
    .failOffsetX([-16, 16])
    .onBegin(() => {
      draggingSV.set(true);
      startIndexSV.set(indexOf(scale, value));
      lastIndexSV.set(indexOf(scale, value));
    })
    .onUpdate((event) => {
      const next = clampIndex(
        scale,
        startIndexSV.get() - Math.round(event.translationY / size.tapeRow),
      );
      if (next === lastIndexSV.get()) return;
      lastIndexSV.set(next);
      if (onDetent) scheduleOnRN(onDetent, valueAt(scale, next));
    })
    .onFinalize(() => {
      draggingSV.set(false);
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: 62, minHeight: size.tapeRow * 9 }}>
        <Text style={[text.label, { marginBottom: 8, textAlign: 'right' }]}>{unit}</Text>
        {Array.from({ length: 9 }, (_, row) => {
          const distance = row - 4;
          const index = active + distance;
          if (index < 0 || index >= scale.n)
            return <View key={distance} style={{ height: size.tapeRow }} />;

          const isActive = distance === 0;
          const even = distance % 2 === 0;
          const tickWidth = isActive ? 15 : even ? 11 : 7;
          const tickHeight = isActive ? 2 : 1;

          return (
            <View
              key={distance}
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
      </View>
    </GestureDetector>
  );
}
