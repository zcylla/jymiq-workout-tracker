import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

import { color, radius, space, text, wash } from '@/theme';

/**
 * One component for filters and multi-select (§0). Drawn at ~34pt, which is
 * under the touch floor, so it keeps its drawn size and expands hitSlop —
 * the rule for visually-small controls.
 */
export function Chip({
  label,
  on = false,
  onPress,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 13,
        borderRadius: radius.chip,
        borderCurve: 'continuous',
        backgroundColor: on ? wash.chip : wash.field,
      }}
    >
      <Text style={[text.pill, { color: on ? color.accent : color.lo }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * A scrollable strip of chips that bleeds past the 22pt side margin: a chip cut
 * by the screen edge reads as "more to the right", a chip cut by a padding box
 * reads as a bug.
 */
export function ChipStrip({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -space.pad }}
      contentContainerStyle={{ gap: 6, paddingHorizontal: space.pad }}
    >
      {children}
    </ScrollView>
  );
}
