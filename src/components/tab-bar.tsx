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
import { useSessionRunning } from '@/data/running';
import {
  color,
  controlBarBlur,
  controlEdgeDense,
  fabShadow,
  hairline,
  type Ink,
  motion,
  radius,
  text,
} from '@/theme';

import { GlassUnder, glassStyle } from './glass';
import { tick } from './haptics';
import { Icon, type IconName } from './icon';
import { AnimatedPressable, usePressFeel } from './press';
import { useScreenBlurTarget, useSheetOpen } from './screen-blur';

/**
 * W2 (Lab 23) — four labelled tabs on one plane with an inset circular start
 * button. These are the drawn parts only; the router wires them up.
 *
 * The bar blurs the live screen at the owner's request: measured ~51% janky frames versus ~5% without it at blur 20; the bar now blurs at 50.
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
 * and which blur remains mounted after the fade are React state.
 */
export function TabBar({ children, onStart }: { children: ReactNode; onStart?: () => void }) {
  const insets = useSafeAreaInsets();
  const minimisedSV = useContext(MinimisedContext);
  const target = useScreenBlurTarget();
  const sheetOpen = useSheetOpen();
  const visibilitySV = useSharedValue(sheetOpen ? 0 : 1);
  useEffect(() => {
    visibilitySV.set(withTiming(sheetOpen ? 0 : 1, { duration: motion.fast }));
  }, [sheetOpen, visibilitySV]);
  const visibility = useAnimatedStyle(() => ({ opacity: visibilitySV.get() }));
  if (!minimisedSV) throw new Error('TabBar must be inside <TabBarProvider>');
  const surface = target
    ? {
        ...glassStyle(controlBarBlur, controlBarBlur.blur),
        borderWidth: controlEdgeDense.borderWidth,
        borderColor: 'transparent',
      }
    : controlEdgeDense;

  const progressSV = useDerivedValue(() =>
    withTiming(minimisedSV.get(), { duration: motion.base }),
  );
  const [minimised, setMinimised] = useState(false);
  const [blurEndpoint, setBlurEndpoint] = useState<number | null>(0);
  useAnimatedReaction(
    () => minimisedSV.get() === 1,
    (now) => scheduleOnRN(setMinimised, now),
  );
  useAnimatedReaction(
    () => {
      const progress = progressSV.get();
      return progress === 0 || progress === 1 ? progress : null;
    },
    (now, previous) => {
      if (now !== previous) scheduleOnRN(setBlurEndpoint, now);
    },
  );
  const fullBlurs = target && (!minimised || blurEndpoint !== 1);
  const smallBlurs = target && (minimised || blurEndpoint !== 0);
  const full = useAnimatedStyle(() => ({
    opacity: 1 - progressSV.get(),
    transform: [{ scale: 1 - 0.06 * progressSV.get() }],
  }));
  const small = useAnimatedStyle(() => ({
    opacity: progressSV.get(),
    transform: [{ scale: 0.94 + 0.06 * progressSV.get() }],
  }));

  return (
    <Animated.View
      pointerEvents={sheetOpen ? 'none' : 'auto'}
      importantForAccessibility={sheetOpen ? 'no-hide-descendants' : 'auto'}
      accessibilityElementsHidden={sheetOpen}
      style={[
        {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom + 8, 30),
          height: 60,
        },
        visibility,
      ]}
    >
      <Animated.View
        pointerEvents={minimised ? 'none' : 'auto'}
        importantForAccessibility={minimised ? 'no-hide-descendants' : 'auto'}
        style={[StyleSheet.absoluteFill, { flexDirection: 'row', alignItems: 'center' }, full]}
      >
        <View
          style={[
            {
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              padding: 4,
              borderRadius: radius.sheet,
              borderCurve: 'continuous',
              ...(fullBlurs ? surface : controlEdgeDense),
            },
          ]}
        >
          {fullBlurs ? (
            <GlassUnder
              recipe={controlBarBlur}
              blur={controlBarBlur.blur}
              target={target}
              radius={radius.sheet}
            />
          ) : null}
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
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
              paddingVertical: 9,
              paddingHorizontal: 18,
              borderRadius: radius.full,
              ...(smallBlurs ? surface : controlEdgeDense),
            },
          ]}
        >
          {smallBlurs ? (
            <GlassUnder
              recipe={controlBarBlur}
              blur={controlBarBlur.blur}
              target={target}
              radius={radius.full}
            />
          ) : null}
          {TAB_NAMES.map((name) => (
            <CurrentTab key={name} name={name} minimisedSV={minimisedSV} />
          ))}
          <View style={{ width: 1, height: 16, backgroundColor: hairline.onPlate }} />
          <Text style={[text.pill, { color: color.lo }]}>{TAB_NAMES.length - 1} MORE</Text>
        </Pressable>
        <StartButton minimised onPress={onStart} />
      </Animated.View>
    </Animated.View>
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
 * One tab. Active state keeps the existing colour-only signal and fixed stroke.
 * The accent face sits over the dim one and only its opacity moves, preserving
 * the label and icon's shared transition without per-frame SVG prop updates.
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
  const running = useSessionRunning() === true;
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
        accessibilityLabel={running ? 'Resume workout' : 'Start a workout'}
        style={[
          {
            width: diameter,
            height: diameter,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: running ? color.live : color.accent,
            boxShadow: fabShadow,
          },
          press.style,
        ]}
      >
        <Icon
          name={running ? 'resume' : 'start'}
          size={minimised ? 20 : undefined}
          tone={color.ink}
        />
      </AnimatedPressable>
    </View>
  );
}
