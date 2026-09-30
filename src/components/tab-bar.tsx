import { type TabTriggerSlotProps, useTabTrigger } from 'expo-router/ui';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { stepBar } from '@/lib/tab-bar';
import { chromeShadow, color, fabShadow, hairline, type Ink, motion, radius, text } from '@/theme';

import { tick } from './haptics';
import { Icon, type IconName } from './icon';
import { AnimatedPressable, usePressFeel } from './press';

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

const TABS = {
  today: { icon: 'today', label: 'Today' },
  session: { icon: 'session', label: 'Session' },
  history: { icon: 'cal', label: 'History' },
  load: { icon: 'load', label: 'Load' },
} as const satisfies Record<string, { icon: IconName; label: string }>;

export type TabName = keyof typeof TABS;
const TAB_NAMES = Object.keys(TABS) as TabName[];

/**
 * W5's signal: 1 while the bar is minimised. The bar is a sibling of the screens, so the
 * scroll has to reach it through a shared value that lives above both.
 */
const MinimisedContext = createContext<SharedValue<number> | null>(null);

export function TabBarProvider({ children }: { children: ReactNode }) {
  const minimisedSV = useSharedValue(0);
  return <MinimisedContext.Provider value={minimisedSV}>{children}</MinimisedContext.Provider>;
}

/**
 * The `onScroll` for a scroller inside the tabs, feeding W5. Undefined outside the tab shell,
 * so a screen pushed over the tabs registers no scroll handler at all.
 */
export function useTabBarScroll() {
  const minimisedSV = useContext(MinimisedContext);
  const anchorSV = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    if (!minimisedSV) return;
    const was = minimisedSV.get() === 1;
    const next = stepBar({ minimised: was, anchor: anchorSV.get() }, e.contentOffset.y);
    anchorSV.set(next.anchor);
    if (next.minimised !== was) minimisedSV.set(next.minimised ? 1 : 0);
  });
  return minimisedSV ? onScroll : undefined;
}

/**
 * W5 (Lab 23): scrolled down, the bar collapses to the current tab and a count of the
 * others, and the start button survives at 46. The plane keeps its full height, so nothing
 * relayouts: two layers cross-fade on the UI thread, and only which one takes touches
 * is React state.
 */
export function TabBar({ children, onStart }: { children: ReactNode; onStart?: () => void }) {
  const insets = useSafeAreaInsets();
  const minimisedSV = useContext(MinimisedContext);
  if (!minimisedSV) throw new Error('TabBar must be inside <TabBarProvider>');

  const progressSV = useDerivedValue(() =>
    withTiming(minimisedSV.get(), { duration: motion.base }),
  );
  const [minimised, setMinimised] = useState(false);
  useAnimatedReaction(
    () => minimisedSV.get() === 1,
    (now) => scheduleOnRN(setMinimised, now),
  );
  const full = useAnimatedStyle(() => ({
    opacity: 1 - progressSV.get(),
    transform: [{ scale: 1 - 0.06 * progressSV.get() }],
  }));
  const small = useAnimatedStyle(() => ({
    opacity: progressSV.get(),
    transform: [{ scale: 0.94 + 0.06 * progressSV.get() }],
  }));

  return (
    <View
      style={{ height: 60, marginHorizontal: 16, marginBottom: Math.max(insets.bottom + 8, 30) }}
    >
      <Animated.View
        pointerEvents={minimised ? 'none' : 'auto'}
        importantForAccessibility={minimised ? 'no-hide-descendants' : 'auto'}
        style={[StyleSheet.absoluteFill, { flexDirection: 'row', alignItems: 'center' }, full]}
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
      </Animated.View>

      <Animated.View
        pointerEvents={minimised ? 'auto' : 'none'}
        importantForAccessibility={minimised ? 'auto' : 'no-hide-descendants'}
        style={[
          StyleSheet.absoluteFill,
          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
          small,
        ]}
      >
        <Pressable
          onPress={() => minimisedSV.set(0)}
          hitSlop={{ top: 4, bottom: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Show tabs"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            paddingVertical: 9,
            paddingHorizontal: 18,
            borderRadius: radius.full,
            backgroundColor: color.raised,
            boxShadow: chromeShadow,
          }}
        >
          {TAB_NAMES.map((name) => (
            <CurrentTab key={name} name={name} minimisedSV={minimisedSV} />
          ))}
          <View style={{ width: 1, height: 16, backgroundColor: hairline.onPlate }} />
          <Text style={[text.pill, { color: color.lo }]}>{TAB_NAMES.length - 1} MORE</Text>
        </Pressable>
        <StartButton minimised onPress={onStart} />
      </Animated.View>
    </View>
  );
}

/** The minimised pill's face for one tab: drawn only while that tab is the active one. */
function CurrentTab({ name, minimisedSV }: { name: TabName; minimisedSV: SharedValue<number> }) {
  const { isFocused } = useTabTrigger({ name }).triggerProps;
  useEffect(() => {
    if (isFocused) minimisedSV.set(0);
  }, [isFocused, minimisedSV]);
  if (!isFocused) return null;
  return (
    <>
      <Icon name={TABS[name].icon} tone={color.accent} />
      <Text style={text.pillTab}>{TABS[name].label}</Text>
    </>
  );
}

/**
 * One tab. Active state is carried by colour alone — the icons are font glyphs
 * with the stroke baked in, so kit's 1.9-vs-1.5 weight shift has no runtime
 * equivalent. The label changes colour with the icon, which is the louder half
 * of that signal anyway. A glyph's colour is not animatable, so the accent
 * copy sits over the dim one and only its opacity moves.
 */
export function TabItem({
  tab,
  isFocused = false,
  // Dropped on purpose: `href` is web-only and Pressable ignores it, and `style`
  // is the library's own row style, which is not the one we want.
  href: _href,
  style: _style,
  ...rest
}: TabTriggerSlotProps & { tab: TabName }) {
  const { icon, label } = TABS[tab];
  const focusSV = useSharedValue(isFocused ? 1 : 0);
  useEffect(() => {
    focusSV.set(withTiming(isFocused ? 1 : 0, { duration: motion.fast }));
  }, [isFocused, focusSV]);
  const lit = useAnimatedStyle(() => ({ opacity: focusSV.get() }));

  return (
    <Pressable
      {...rest}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      // Set here rather than on the JSX element: TabTrigger's asChild slot merges
      // style by object spread, so an array passed in from outside is silently lost.
      style={{ flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 3 }}
    >
      <TabFace icon={icon} label={label} tone={color.lo} />
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, lit]}
      >
        <TabFace icon={icon} label={label} tone={color.accent} />
      </Animated.View>
    </Pressable>
  );
}

function TabFace({ icon, label, tone }: { icon: IconName; label: string; tone: Ink }) {
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <Icon name={icon} tone={tone} />
      <Text style={[text.tab, { color: tone }]}>{label}</Text>
    </View>
  );
}

/** The start button, sitting in the bar's middle slot rather than over it. */
export function StartButton({
  onPress,
  minimised = false,
}: {
  onPress?: () => void;
  minimised?: boolean;
}) {
  const press = usePressFeel(0.15);
  const diameter = minimised ? 46 : 52;
  return (
    <View style={{ width: minimised ? diameter : 66, alignItems: 'center' }}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          tick();
          press.handlers.onPressIn();
        }}
        onPressOut={press.handlers.onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Start a workout"
        style={[
          {
            width: diameter,
            height: diameter,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color.accent,
            boxShadow: fabShadow,
          },
          press.style,
        ]}
      >
        <Icon name="start" size={minimised ? 20 : undefined} tone={color.ink} />
      </AnimatedPressable>
    </View>
  );
}
