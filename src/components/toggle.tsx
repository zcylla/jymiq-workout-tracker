import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { color, motion, radius, size, text, wash } from '@/theme';

import { pop } from './haptics';

/**
 * kit's `toggle()`. The switch is drawn at 44x26, under the touch floor on its
 * own, so the whole row is the target rather than the knob.
 */
export function Toggle({
  label,
  meta,
  on,
  onToggle,
}: {
  label: string;
  meta?: string;
  on: boolean;
  onToggle?: (next: boolean) => void;
}) {
  const knobSV = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    knobSV.set(withTiming(on ? 1 : 0, { duration: motion.fast }));
  }, [on, knobSV]);

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: knobSV.get() * 18 }] }));

  return (
    <Pressable
      onPress={() => {
        pop();
        onToggle?.(!on);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 7,
        minHeight: size.hit,
      }}
    >
      <View style={{ gap: 3, flexShrink: 1 }}>
        <Text style={text.rowName}>{label}</Text>
        {meta ? <Text style={text.meta}>{meta}</Text> : null}
      </View>
      <View style={{ flex: 1 }} />
      <View
        style={{
          width: 44,
          height: 26,
          borderRadius: radius.full,
          padding: 3,
          backgroundColor: on ? color.accent : wash.off,
        }}
      >
        <Animated.View
          style={[
            {
              width: 20,
              height: 20,
              borderRadius: radius.full,
              backgroundColor: on ? color.ink : color.lo,
            },
            knob,
          ]}
        />
      </View>
    </Pressable>
  );
}
