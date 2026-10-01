import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, controlEdgeDense, fabShadow, radius, text } from '@/theme';

import { tick } from './haptics';
import { AnimatedPressable, usePressFeel } from './press';

/** The plane the bar occupies, so a `Screen` under it can clear its last row. */
export function useActionBarHeight() {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + Math.max(insets.bottom + 8, 30);
}

const BAR_HEIGHT = 56;

/**
 * kit's `actionbar()`. A pushed screen has no tab bar, so its primary action
 * takes that plane — same geometry as the bar it replaces.
 */
export function ActionBar({
  primary,
  onPrimary,
  secondary,
  onSecondary,
  disabled = false,
}: {
  primary: string;
  onPrimary?: () => void;
  secondary?: string;
  onSecondary?: () => void;
  /** Dim and inert: the button says the action is not available, instead of a dialog saying why. */
  disabled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const secondaryPress = usePressFeel();
  const primaryPress = usePressFeel(0.15);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        marginHorizontal: 16,
        marginBottom: Math.max(insets.bottom + 8, 30),
      }}
    >
      {secondary ? (
        <AnimatedPressable
          onPress={onSecondary}
          {...secondaryPress.handlers}
          style={[
            {
              minHeight: BAR_HEIGHT,
              paddingHorizontal: 18,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.bar,
              borderCurve: 'continuous',
              ...controlEdgeDense,
            },
            secondaryPress.style,
          ]}
        >
          <Text style={[text.pill, { color: color.hi }]}>{secondary}</Text>
        </AnimatedPressable>
      ) : null}

      <AnimatedPressable
        onPress={onPrimary}
        onPressIn={() => {
          tick();
          primaryPress.handlers.onPressIn();
        }}
        onPressOut={primaryPress.handlers.onPressOut}
        disabled={disabled}
        accessibilityState={{ disabled }}
        style={[
          {
            flex: 1,
            minHeight: BAR_HEIGHT,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.bar,
            borderCurve: 'continuous',
            backgroundColor: color.accent,
            boxShadow: fabShadow,
          },
          disabled ? { opacity: 0.4 } : primaryPress.style,
        ]}
      >
        <Text style={text.action}>{primary}</Text>
      </AnimatedPressable>
    </View>
  );
}
