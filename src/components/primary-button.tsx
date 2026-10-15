import { Text } from 'react-native';

import { color, radius, rowSurface, size, space, text, tileSurface } from '@/theme';
import { disabledControl } from '@/theme/tokens';

import { AnimatedPressable, usePressFeel } from './press';

/** The primary action inside a sheet. */
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
          ...tileSurface,
          ...rowSurface.selected,
          minHeight: size.hit,
          paddingHorizontal: space.within,
          paddingVertical: space.row,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.row,
          borderCurve: 'continuous',
        },
        disabled && disabledControl.surface,
        press.style,
      ]}
    >
      <Text style={[text.action, { color: disabled ? disabledControl.label : color.accent }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}
