import { BlurTargetView } from 'expo-blur';
import { useIsFocused } from 'expo-router';
import { type ReactNode, type Ref, useEffect, useRef } from 'react';
import type { ScrollView } from 'react-native';
import { Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGlassTrial } from '@/data/glass-trial';
import { screenBlurs } from '@/lib/glass-trial';
import { color, space } from '@/theme';

import { Backdrop } from './backdrop';
import { BlurTargetContext } from './glass';
import { ScreenBlurTargetContext, useScreenBlurRegistration } from './screen-blur';
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
  const rootTargetRef = useRef<View>(null);
  const registerBlurTarget = useScreenBlurRegistration();
  const focused = useIsFocused();
  const trial = useGlassTrial();
  const blurs = screenBlurs(trial);
  const floatingBlurs = trial.style !== 'off' && trial.scope !== 'off';
  useEffect(() => {
    if (!focused || !floatingBlurs || !registerBlurTarget) return;
    return registerBlurTarget(rootTargetRef);
  }, [focused, registerBlurTarget, floatingBlurs]);
  const padding = {
    paddingHorizontal: space.pad,
    paddingTop: insets.top,
    paddingBottom: scroll ? insets.bottom + space.between + bottomInset : bottomInset,
  };
  const content = (
    <ScreenBlurTargetContext.Provider value={null}>
      {/* Android uses the backdrop ref as a static material marker; iOS keeps its native target. */}
      {blurs && Platform.OS !== 'android' ? (
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
    </ScreenBlurTargetContext.Provider>
  );
  return floatingBlurs ? (
    <BlurTargetView ref={rootTargetRef} style={{ flex: 1, backgroundColor: color.ground }}>
      {content}
    </BlurTargetView>
  ) : (
    <View style={{ flex: 1, backgroundColor: color.ground }}>{content}</View>
  );
}
