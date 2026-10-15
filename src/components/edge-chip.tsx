import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

import { chipSurface, color, text } from '@/theme';

import { GlassUnder, glassStyle, useControlGlass } from './glass';
import { pop } from './haptics';

/** A static warm selector; selection uses an accent wash and label. */
export function EdgeChip({
  label,
  active,
  onPress,
  height,
  radius,
  minWidth,
  hitSlop,
  surface = 'inner',
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
  const { recipe, blur, target } = useControlGlass();
  const inner = surface === 'inner';
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
        inner ? chipSurface.fill : recipe ? glassStyle(recipe, blur) : null,
        active && (inner ? chipSurface.selected : { boxShadow: `0 0 0 1.5px ${color.accent}` }),
      ]}
    >
      {!inner && recipe ? (
        <GlassUnder recipe={recipe} blur={blur} target={target} radius={radius} />
      ) : null}
      <Text
        numberOfLines={1}
        style={[
          text.pill,
          { color: active ? chipSurface.activeLabel : inner ? chipSurface.label : color.lo },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
