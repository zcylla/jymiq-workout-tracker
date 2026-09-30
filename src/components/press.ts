import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const IN_MS = 90;
const OUT_MS = 140;

/** Press feel on the UI thread: spread `handlers` on an `AnimatedPressable` and add `style` to it. */
export function usePressFeel(dim = 0.3) {
  const pressSV = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - dim * pressSV.get(),
    transform: [{ scale: 1 - 0.02 * pressSV.get() }],
  }));
  const handlers = {
    onPressIn: () => pressSV.set(withTiming(1, { duration: IN_MS })),
    onPressOut: () => pressSV.set(withTiming(0, { duration: OUT_MS })),
  };
  return { style, handlers };
}
