import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const IN_MS = 90;
const OUT_MS = 140;

/** Press feel on the UI thread: spread `handlers` on an `AnimatedPressable` and add `style` to it. */
export function usePressFeel(dim = 0.3, disabled = false) {
  const pressSV = useSharedValue(0);
  useEffect(() => {
    if (disabled) {
      cancelAnimation(pressSV);
      pressSV.set(0);
    }
  }, [disabled, pressSV]);
  const style = useAnimatedStyle(() => ({
    opacity: disabled ? 1 : 1 - dim * pressSV.get(),
    transform: [{ scale: disabled ? 1 : 1 - 0.02 * pressSV.get() }],
  }));
  const handlers = {
    onPressIn: () => {
      if (!disabled) pressSV.set(withTiming(1, { duration: IN_MS }));
    },
    onPressOut: () => {
      if (!disabled) pressSV.set(withTiming(0, { duration: OUT_MS }));
    },
  };
  return { style, handlers };
}
