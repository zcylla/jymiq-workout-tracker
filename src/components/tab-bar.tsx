import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chromeShadow, color, fabShadow, radius, text } from '@/theme';

import { Icon, type IconName } from './icon';

/**
 * W2 (Lab 23) — four labelled tabs on one plane with an inset circular start
 * button. These are the drawn parts only; the router wires them up.
 *
 * On Android the plane is an opaque raised plate, not glass (Lab 43 N2). That is
 * a platform switch rather than a fallback: blur on Android is a per-frame
 * RenderEffect re-capture, measured at +98% frame duration with moving content
 * behind it, which is exactly a bar over a scrolling list.
 */
/** Plate (4 + 52 + 4) plus the air beneath it. Content scrolls under the bar,
 *  so any scroller inside a tab must pad by this much to clear its last row. */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  return 60 + Math.max(insets.bottom + 8, 30);
}

export function TabBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: Math.max(insets.bottom + 8, 30),
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          padding: 4,
          borderRadius: radius.sheet,
          borderCurve: 'continuous',
          backgroundColor: color.raised,
          boxShadow: chromeShadow,
        }}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * One tab. Active state is carried by colour alone — the icons are font glyphs
 * with the stroke baked in, so kit's 1.9-vs-1.5 weight shift has no runtime
 * equivalent. The label changes colour with the icon, which is the louder half
 * of that signal anyway.
 */
export function TabItem({
  icon,
  label,
  isFocused = false,
  // Dropped on purpose: `href` is web-only and Pressable ignores it, and `style`
  // is the library's own row style, which is not the one we want.
  href: _href,
  style: _style,
  ...rest
}: TabTriggerSlotProps & { icon: IconName; label: string }) {
  const tone = isFocused ? color.accent : color.lo;
  return (
    <Pressable
      {...rest}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      // Set here rather than on the JSX element: TabTrigger's asChild slot merges
      // style by object spread, so an array passed in from outside is silently lost.
      style={{ flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 3 }}
    >
      <Icon name={icon} tone={tone} />
      <Text style={[text.tab, { color: tone }]}>{label}</Text>
    </Pressable>
  );
}

/** The start button, sitting in the bar's middle slot rather than over it. */
export function StartButton({ onPress }: { onPress?: () => void }) {
  return (
    <View style={{ width: 66, alignItems: 'center' }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Start a workout"
        style={({ pressed }) => [
          {
            width: 52,
            height: 52,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color.accent,
            boxShadow: fabShadow,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Icon name="start" tone={color.ink} />
      </Pressable>
    </View>
  );
}
