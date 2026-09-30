import { BlurTargetView } from 'expo-blur';
import { type ReactNode, type Ref, useRef } from 'react';
import type { ScrollView } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGlassTrial } from '@/data/glass-trial';
import { screenBlurs } from '@/lib/glass-trial';
import { color, space } from '@/theme';

import { Backdrop } from './backdrop';
import { BlurTargetContext } from './glass';
import { useTabBarScroll } from './tab-bar';

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
  scrollRef,
}: {
  children: ReactNode;
  /** Height of any chrome the content scrolls under — the tab bar, or an action bar. */
  bottomInset?: number;
  /**
   * False renders a fixed, non-scrolling body — the live screen keeps vertical drags for gestures.
   * Nothing scrolls under the chrome then, so the bottom pad is `bottomInset` alone.
   */
  scroll?: boolean;
  /** For a screen that opens scrolled to one of its sections. */
  scrollRef?: Ref<ScrollView>;
}) {
  const insets = useSafeAreaInsets();
  const onScroll = useTabBarScroll();
  const targetRef = useRef<View>(null);
  const blurs = screenBlurs(useGlassTrial());
  const padding = {
    paddingHorizontal: space.pad,
    paddingTop: insets.top,
    paddingBottom: scroll ? insets.bottom + space.between + bottomInset : bottomInset,
  };
  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      {/* expo-blur on Android blurs only what sits inside a BlurTargetView, and a
          BlurView must not be inside its own target — so the target is the backdrop alone. */}
      {blurs ? (
        <BlurTargetView ref={targetRef} style={StyleSheet.absoluteFill}>
          <Backdrop />
        </BlurTargetView>
      ) : (
        <Backdrop />
      )}
      <BlurTargetContext.Provider value={blurs ? targetRef : null}>
        {scroll ? (
          <Animated.ScrollView
            ref={scrollRef}
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={{ flex: 1 }}
            contentContainerStyle={padding}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </Animated.ScrollView>
        ) : (
          <View style={[{ flex: 1 }, padding]}>{children}</View>
        )}
      </BlurTargetContext.Provider>
    </View>
  );
}
