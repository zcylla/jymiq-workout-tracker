import { useEffect } from 'react';
import { Text, type TextStyle, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

type RollingStyle = TextStyle & { lineHeight: number };

function Digit({ digit, style }: { digit: number; style: RollingStyle }) {
  const offsetSV = useSharedValue(-digit * style.lineHeight);

  useEffect(() => {
    offsetSV.set(
      withTiming(-digit * style.lineHeight, { duration: 350, easing: Easing.out(Easing.cubic) }),
    );
  }, [digit, offsetSV, style.lineHeight]);

  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: offsetSV.get() }] }));

  return (
    <View style={{ height: style.lineHeight, overflow: 'hidden' }}>
      <Animated.View style={animated}>
        {/* One Text per cell: a single multi-line Text is measured against the clip's height
            on Android and lays out only its first line. */}
        {DIGITS.map((d) => (
          <Text key={d} style={[style, { height: style.lineHeight }]}>
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

/**
 * Each changed digit rolls vertically. `style` is a mono text style with an explicit lineHeight,
 * which is also the height of one digit cell. Digits are keyed from the right so a place keeps
 * its identity when the number gains a digit.
 */
export function RollingNumber({ value, style }: { value: string | number; style: RollingStyle }) {
  const chars = String(value).split('');
  return (
    <View
      accessible
      accessibilityLabel={String(value)}
      style={{ flexDirection: 'row' }}
      importantForAccessibility="yes"
    >
      {chars.map((char, i) => {
        const key = chars.length - i;
        return /\d/.test(char) ? (
          <Digit key={key} digit={Number(char)} style={style} />
        ) : (
          <Text key={key} style={style}>
            {char}
          </Text>
        );
      })}
    </View>
  );
}
