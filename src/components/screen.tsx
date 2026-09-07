import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, space } from '@/theme';

/**
 * The screen shell — kit's `.scr`. Ground, the 22pt side margin, and the real
 * safe-area insets rather than the boards' fixed 402x860 frame.
 *
 * Content scrolls under the chrome rather than stopping short of it, so the
 * bottom pad is a section's worth of air; Phase 4's tab bar sits on top of it.
 */
export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.ground }}
      contentContainerStyle={{
        paddingHorizontal: space.pad,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + space.between,
      }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
