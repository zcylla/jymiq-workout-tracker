import type { ReactNode } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, hairline, radius, space, wash } from '@/theme';

/**
 * The shared shell for every overlay on the live screen (sets, exercises, the
 * keypad).
 *
 * `@expo/ui`'s native `BottomSheet` was tried here first and rejected on the
 * device: it renders and lays out, but **no touch reaches any React Native
 * child inside it** — every row and both footer buttons were inert. It also
 * measures children against an unbounded width, so a row of fixed columns and
 * a flex spacer collapsed short of the right edge. Neither shows up in a
 * type-check, a lint, or a screenshot of the closed state.
 *
 * So the scrim, the panel and the dismiss are ours. Back is handled by the
 * screen rather than here, because it has to close a sheet *before* it reaches
 * the session-discard confirm, and one handler that knows both is clearer than
 * two that race.
 */
export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!open) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: wash.scrim }}
      />
      <View
        style={{
          width,
          maxHeight: height * 0.8,
          backgroundColor: color.panel,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          borderCurve: 'continuous',
          paddingBottom: Math.max(insets.bottom, space.within),
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 6 }}>
          <View
            style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: hairline.onPlate }}
          />
        </View>
        <ScrollView
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: space.pad, paddingBottom: space.within }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}
