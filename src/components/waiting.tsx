import { type ReactNode, useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** Slow breathing pulse for an idle or awaiting-input state. `delay` staggers siblings. */
export function Waiting({
  children,
  style,
  delay = 0,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}) {
  const breathSV = useSharedValue(0);

  useEffect(() => {
    breathSV.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }), -1, true),
      ),
    );
  }, [breathSV, delay]);

  const animated = useAnimatedStyle(() => ({
    opacity: 1 - 0.4 * breathSV.get(),
    transform: [{ scale: 1 - 0.01 * breathSV.get() }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
