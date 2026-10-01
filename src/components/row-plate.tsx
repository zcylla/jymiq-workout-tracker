import { createContext, type ReactNode, useContext } from 'react';
import { View } from 'react-native';

import { color, containment, radius, space } from '@/theme';

import { GlassUnder, glassStyle, useControlGlass, useGlass } from './glass';
import { AnimatedPressable, usePressFeel } from './press';

const TintedRows = createContext(false);

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
  tone?: 'raised' | 'panel' | 'destructive';
  disabled?: boolean;
}) {
  const press = usePressFeel();
  const tinted = useContext(TintedRows);
  const control = useControlGlass();
  const row = useGlass('row');
  const { recipe, blur, target } = tinted ? control : row;
  const glass = tone !== 'destructive' ? recipe : null;
  const style = [
    containment.rowPlate,
    { paddingHorizontal: 14 },
    tone === 'panel' && { backgroundColor: color.panel },
    glass && glassStyle(glass, blur),
    tone === 'destructive' && { backgroundColor: color.live },
  ];
  const under = glass ? (
    <GlassUnder recipe={glass} blur={blur} target={target} radius={radius.row} />
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
export function RowPlates({ children, tinted = false }: { children: ReactNode; tinted?: boolean }) {
  return (
    <TintedRows.Provider value={tinted}>
      <View style={{ gap: space.row }}>{children}</View>
    </TintedRows.Provider>
  );
}
