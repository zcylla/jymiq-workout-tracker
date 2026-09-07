import { Stack } from 'expo-router';

import { color } from '@/theme';

/**
 * The Session tab is a hub, not one screen: routines, programs and the library
 * are all views of it (Lab 34 A1, Lab 35 B1 — both drawn with the tab bar
 * showing). A stack nested inside the tab is what keeps the bar while pushing;
 * a true detail screen is a sibling of `(tabs)` instead and loses it.
 */
export default function SessionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: color.ground },
        animation: 'slide_from_right',
      }}
    />
  );
}
