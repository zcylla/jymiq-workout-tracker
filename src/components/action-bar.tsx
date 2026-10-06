import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, controlBarBlur, controlEdgeDense, fabShadow, radius, text } from '@/theme';
import { disabledControl } from '@/theme/tokens';

import { GlassUnder, glassStyle } from './glass';
import { tick } from './haptics';
import { AnimatedPressable, usePressFeel } from './press';
import { useFloatingBlurTarget, useSheetOpen } from './screen-blur';

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
  tone = 'accent',
}: {
  primary: string;
  onPrimary?: () => void;
  secondary?: string;
  onSecondary?: () => void;
  /** Dim and inert: the button says the action is not available, instead of a dialog saying why. */
  disabled?: boolean;
  tone?: 'accent' | 'done';
}) {
  const insets = useSafeAreaInsets();
  const secondaryPress = usePressFeel();
  const primaryPress = usePressFeel(0.15, disabled);
  const sheetOpen = useSheetOpen();
  const target = useFloatingBlurTarget(!sheetOpen);
  return (
    <View
      pointerEvents={sheetOpen ? 'none' : 'auto'}
      style={{
        opacity: sheetOpen ? 0 : 1,
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
              ...(target
                ? {
                    ...glassStyle(controlBarBlur, controlBarBlur.blur),
                    borderWidth: controlEdgeDense.borderWidth,
                    borderColor: 'transparent',
                  }
                : controlEdgeDense),
            },
            secondaryPress.style,
          ]}
        >
          {target ? (
            <GlassUnder
              fadeIn
              recipe={controlBarBlur}
              blur={controlBarBlur.blur}
              target={target}
              radius={radius.bar}
            />
          ) : null}
          <Text style={[text.pill, { color: color.hi }]}>{secondary}</Text>
        </AnimatedPressable>
      ) : null}

      <AnimatedPressable
        onPress={onPrimary}
        onPressIn={() => {
          if (disabled) return;
          tick();
          primaryPress.handlers.onPressIn();
        }}
        onPressOut={primaryPress.handlers.onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={[
          {
            flex: 1,
            minHeight: BAR_HEIGHT,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.bar,
            borderCurve: 'continuous',
            backgroundColor: tone === 'done' ? color.done : color.accent,
            boxShadow: fabShadow,
          },
          disabled && disabledControl.surface,
          primaryPress.style,
        ]}
      >
        <Text style={[text.action, disabled && { color: disabledControl.label }]}>{primary}</Text>
      </AnimatedPressable>
    </View>
  );
}
