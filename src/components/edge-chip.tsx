import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

import { color, text } from '@/theme';

import { GlassUnder, glassStyle, useControlGlass } from './glass';
import { pop } from './haptics';

/**
 * One option of a selector row, in the edge control look with blur. The chosen one is
 * marked by an accent ring and the accent label; the others have no ring.
 */
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
}) {
  const { recipe, blur, target } = useControlGlass();
  const glass = recipe ? glassStyle(recipe, blur) : null;
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
        glass,
        active && { boxShadow: `0 0 0 1.5px ${color.accent}` },
      ]}
    >
      {recipe ? <GlassUnder recipe={recipe} blur={blur} target={target} radius={radius} /> : null}
      <Text numberOfLines={1} style={[text.pill, { color: active ? color.accent : color.lo }]}>
        {label}
      </Text>
    </Pressable>
  );
}
