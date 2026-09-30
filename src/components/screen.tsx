import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, space } from '@/theme';

import { Backdrop } from './backdrop';

/**
 * The screen shell — kit's `.scr`. Ground, the 22pt side margin, and the real
 * safe-area insets rather than the boards' fixed 402x860 frame.
 *
 * Content scrolls under the chrome rather than stopping short of it, so the
 * bottom pad is a section's worth of air; Phase 4's tab bar sits on top of it.
 */
export function Screen({
  children,
  bottomInset = 0,
  scroll = true,
}: {
  children: ReactNode;
  /** Height of any chrome the content scrolls under — the tab bar, or an action bar. */
  bottomInset?: number;
  /** False renders a fixed, non-scrolling body — the live screen keeps vertical drags for gestures. */
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingHorizontal: space.pad,
    paddingTop: insets.top,
    paddingBottom: insets.bottom + space.between + bottomInset,
  };
  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Backdrop />
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={padding}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, padding]}>{children}</View>
      )}
    </View>
  );
}
