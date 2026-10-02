import { Text } from 'react-native';

import { color, radius, size, text } from '@/theme';
import { disabledControl } from '@/theme/tokens';

import { AnimatedPressable, usePressFeel } from './press';

/** The one primary action inside a sheet: accent fill, sentence-case label, same as the action bar's primary. */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const press = usePressFeel(0.15, disabled);
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.handlers.onPressIn}
      onPressOut={press.handlers.onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        {
          minHeight: size.hit,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.row,
          borderCurve: 'continuous',
          backgroundColor: color.accent,
        },
        disabled && disabledControl.surface,
        press.style,
      ]}
    >
      <Text style={[text.action, disabled && { color: disabledControl.label }]}>{label}</Text>
    </AnimatedPressable>
  );
}
