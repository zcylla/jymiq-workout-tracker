import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

import { chipSurface, text } from '@/theme';

import { pop } from './haptics';

/** A static neutral selector; selection uses an accent wash and label. */
export function EdgeChip({
  label,
  active,
  onPress,
  height,
  radius,
  minWidth,
  hitSlop,
}: {
  label: ReactNode;
  active: boolean;
  onPress: () => void;
  height: number;
  radius: number;
  minWidth?: number;
  hitSlop?: { top: number; bottom: number };
  surface?: 'inner' | 'control';
}) {
  return (
    <Pressable
      hitSlop={hitSlop}
      onPress={() => {
        if (!active) pop();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        {
          flex: 1,
          minWidth,
          height,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius,
          borderCurve: 'continuous',
        },
        active ? chipSurface.selected : chipSurface.fill,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[text.pill, { color: active ? chipSurface.activeLabel : chipSurface.label }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
