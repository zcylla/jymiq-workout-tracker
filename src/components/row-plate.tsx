import { createContext, type ReactNode, useContext } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, containment, radius, size, space, wash } from '@/theme';
import { disabledControl } from '@/theme/tokens';

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
  tinted: tintedProp,
  selected = false,
  done = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  tone?: 'raised' | 'panel' | 'destructive';
  disabled?: boolean;
  /** Overrides the group's `tinted` for this one row. */
  tinted?: boolean;
  /** Washed and ringed in the accent, the way the week strip marks today. */
  selected?: boolean;
  /** Washed and ringed in the done green. `selected` wins when both are set. */
  done?: boolean;
}) {
  const press = usePressFeel(0.3, disabled);
  const groupTinted = useContext(TintedRows);
  const tinted = tintedProp ?? groupTinted;
  const control = useControlGlass();
  const row = useGlass('row');
  const { recipe, blur, target } = tinted ? control : row;
  const glass = !disabled && tone !== 'destructive' ? recipe : null;
  const style = [
    containment.rowPlate,
    { paddingHorizontal: 14, minHeight: size.hit },
    tone === 'panel' && { backgroundColor: color.panel },
    glass && glassStyle(glass, blur),
    tone === 'destructive' && { backgroundColor: color.live },
    disabled && disabledControl.surface,
  ];
  const under = (
    <>
      {glass ? <GlassUnder recipe={glass} blur={blur} target={target} radius={radius.row} /> : null}
      {(selected || done) && !disabled ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius.row,
              borderCurve: 'continuous',
              backgroundColor: selected ? wash.chip : wash.done,
              borderWidth: 1.5,
              borderColor: selected ? color.accent : color.done,
            },
          ]}
        />
      ) : null}
    </>
  );

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
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      {...press.handlers}
      style={[style, press.style]}
    >
      {under}
      {disabled ? (
        <View style={{ opacity: disabledControl.contentOpacity }}>{children}</View>
      ) : (
        children
      )}
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
