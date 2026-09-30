import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { formatRest } from '@/lib/time';
import { color, hairline, size, text } from '@/theme';

import { AnimatedPressable, usePressFeel } from './press';
import { Waiting } from './waiting';

type Props = {
  /** The wall-clock target, the only truth; the countdown is derived from it. */
  restUntil: number;
  /** Whole seconds left, from the screen's one clock. */
  leftSec: number;
  onExtend: () => void;
  onSkip: () => void;
};

function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  const press = usePressFeel();
  return (
    <AnimatedPressable
      onPress={onPress}
      {...press.handlers}
      accessibilityRole="button"
      style={[
        { minHeight: size.hit, minWidth: size.hit, alignItems: 'center', justifyContent: 'center' },
        press.style,
      ]}
    >
      <Text style={text.body}>{label}</Text>
    </AnimatedPressable>
  );
}

/**
 * Lab 06 tile 04: a linear sweep driven from the timestamp, so a backgrounded
 * app cannot drift it. The line is the share of this rest still to go; +30s
 * grows the span rather than restarting it.
 */
export function RestTimer({ restUntil, leftSec, onExtend, onSkip }: Props) {
  const progressSV = useSharedValue(1);
  const spanSV = useSharedValue(0);

  useEffect(() => {
    const remaining = restUntil - Date.now();
    if (remaining <= 0) return;
    // ponytail: the span starts when this mounts, so a rest resumed after a relaunch reads full.
    const span = Math.max(spanSV.get(), remaining);
    spanSV.set(span);
    progressSV.set(
      withSequence(
        withTiming(remaining / span, { duration: 0 }),
        withTiming(0, { duration: remaining, easing: Easing.linear }),
      ),
    );
  }, [restUntil, progressSV, spanSV]);

  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: progressSV.get() }] }));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Waiting>
          <Text style={[text.num, { color: color.accent }]}>REST {formatRest(leftSec)}</Text>
        </Waiting>
        <View style={{ flex: 1 }} />
        <TextButton label="+30s" onPress={onExtend} />
        <TextButton label="Skip" onPress={onSkip} />
      </View>
      <View style={{ height: 2, backgroundColor: hairline.onGround }}>
        <Animated.View
          style={[{ flex: 1, backgroundColor: color.accent, transformOrigin: 'left' }, fill]}
        />
      </View>
    </View>
  );
}
