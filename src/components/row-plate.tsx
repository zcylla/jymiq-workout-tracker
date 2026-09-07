import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { color, containment, space } from '@/theme';

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
}: {
  children: ReactNode;
  onPress?: () => void;
  tone?: 'raised' | 'panel';
}) {
  const style = [
    containment.rowPlate,
    { paddingHorizontal: 14 },
    tone === 'panel' && { backgroundColor: color.panel },
  ];

  if (!onPress) return <View style={style}>{children}</View>;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [style, pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  );
}

/**
 * kit's `prows()`. The rows are the plates, so whatever section holds this must
 * not be one as well.
 */
export function RowPlates({ children }: { children: ReactNode }) {
  return <View style={{ gap: space.row }}>{children}</View>;
}
