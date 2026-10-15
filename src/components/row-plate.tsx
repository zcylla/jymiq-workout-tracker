import { createContext, type ReactNode, useContext } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, rowSurface, size, space } from '@/theme';
import { disabledControl } from '@/theme/tokens';

import { AnimatedPressable, usePressFeel } from './press';

const SelectedRow = createContext(false);

export function useRowSelected() {
  return useContext(SelectedRow);
}

/** One touchable plate per row, with a 7pt gap between rows (Lab 42 P5). */
export function RowPlate({
  children,
  onPress,
  tone = 'raised',
  disabled = false,
  selected = false,
  done = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  tone?: 'raised' | 'panel' | 'destructive';
  disabled?: boolean;
  /** Retained for compatibility: every row now uses the F surface. */
  tinted?: boolean;
  /** A soft accent wash with an accent hairline and accent text. */
  selected?: boolean;
  /** A thin green hairline on the gray row. `selected` wins when both are set. */
  done?: boolean;
}) {
  const press = usePressFeel(0.3, disabled);
  const destructive = tone === 'destructive';
  const selection = selected && !disabled && !destructive;
  const content = (
    <SelectedRow.Provider value={selection}>
      <View
        pointerEvents="none"
        style={[
          styles.overlay,
          rowSurface.fill,
          destructive && rowSurface.destructive,
          disabled && rowSurface.disabled,
        ]}
      />
      {!disabled && !destructive ? (
        <>
          <View pointerEvents="none" style={[styles.overlay, rowSurface.rim]} />
          {selection || done ? (
            <View
              pointerEvents="none"
              style={[styles.overlay, selection ? rowSurface.selected : rowSurface.done]}
            />
          ) : null}
        </>
      ) : null}
      {disabled ? (
        <View style={{ opacity: disabledControl.contentOpacity }}>{children}</View>
      ) : (
        children
      )}
    </SelectedRow.Provider>
  );

  if (!onPress)
    return (
      <View style={styles.row} accessibilityState={{ disabled, selected: selection }}>
        {content}
      </View>
    );

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: selection }}
      {...press.handlers}
      style={[styles.row, press.style]}
    >
      {content}
    </AnimatedPressable>
  );
}

/** Rows carry their own surfaces; the group supplies only the spacing. */
export function RowPlates({ children }: { children: ReactNode; tinted?: boolean }) {
  return <View style={{ gap: space.row }}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    borderRadius: radius.row,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    minHeight: size.hit,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.row,
    borderCurve: 'continuous',
  },
});
