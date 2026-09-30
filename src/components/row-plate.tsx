import type { ReactNode } from 'react';
import { View } from 'react-native';

import { color, containment, radius, space } from '@/theme';

import { GlassUnder, glassStyle, useGlass } from './glass';
import { AnimatedPressable, usePressFeel } from './press';

/**
 * kit's `prow()` — one row on its own plate (Lab 42 P5).
 *
 * The containment lands on the thing you touch: the row with an edge is the row
 * you press, and the 7pt gap between rows replaces every hairline.
 */
export function RowPlate({
  children,
  onPress,
  tone = 'raised',
  disabled = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  tone?: 'raised' | 'panel';
  disabled?: boolean;
}) {
  const press = usePressFeel();
  const { recipe, blur, target } = useGlass('row');
  const style = [
    containment.rowPlate,
    { paddingHorizontal: 14 },
    tone === 'panel' && { backgroundColor: color.panel },
    recipe && glassStyle(recipe, blur),
  ];
  const under = recipe ? (
    <GlassUnder recipe={recipe} blur={blur} target={target} radius={radius.row} />
  ) : null;

  if (!onPress)
    return (
      <View style={style}>
        {under}
        {children}
      </View>
    );

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      {...press.handlers}
      style={[style, disabled ? { opacity: 0.7 } : press.style]}
    >
      {under}
      {children}
    </AnimatedPressable>
  );
}

/**
 * kit's `prows()`. The rows are the plates, so whatever section holds this must
 * not be one as well.
 */
export function RowPlates({ children }: { children: ReactNode }) {
  return <View style={{ gap: space.row }}>{children}</View>;
}
