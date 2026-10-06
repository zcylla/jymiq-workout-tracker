import { BlurView } from 'expo-blur';
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useGlassTrial } from '@/data/glass-trial';
import { type Element, glassOf } from '@/lib/glass-trial';
import {
  chromeGlass,
  controlGlass,
  controlEdgeDense,
  type GlassRecipe,
  glassRecipes,
  motion,
} from '@/theme';
import { backdropMaterial } from '@/theme/tokens';

/**
 * The backdrop identity: a static material marker on Android, a blur target on iOS.
 * Floating surfaces outside a `Screen` use the separate focused-screen target.
 */
export const BlurTargetContext = createContext<RefObject<View | null> | null>(null);

const targetIds = new WeakMap<RefObject<View | null>, number>();
let nextTargetId = 0;

function blurTargetKey(target: RefObject<View | null>) {
  let id = targetIds.get(target);
  if (id === undefined) {
    id = ++nextTargetId;
    targetIds.set(target, id);
  }
  return id;
}

/** Set by a glass hero card, so the stat tiles inside it can follow it under 'hero+inner'. */
export const GlassHeroContext = createContext(false);

/** The glass lab's verdict for one surface: its recipe (null is opaque) and blur intensity (0 is no BlurView). */
export function useGlass(element: Element) {
  const trial = useGlassTrial();
  const target = useContext(BlurTargetContext);
  const { glass, blur } = glassOf(trial, element);
  const recipe =
    glass && trial.style !== 'off'
      ? element === 'chrome'
        ? chromeGlass
        : glassRecipes[trial.style]
      : null;
  return { recipe, blur: target ? blur : 0, target };
}

export function useControlGlass() {
  const trial = useGlassTrial();
  const target = useContext(BlurTargetContext);
  const recipe = trial.style !== 'off' && trial.scope !== 'off' ? controlGlass : null;
  return { recipe, blur: recipe && target ? recipe.blur : 0, target };
}

/** The surface's own style: the whole recipe, or only the drop shadow when a `GlassUnder` draws the fill. */
export function glassStyle(recipe: GlassRecipe, blur: number): ViewStyle {
  if (blur > 0) return { backgroundColor: 'transparent', boxShadow: recipe.drop || [] };
  return {
    ...recipe.fill,
    boxShadow: recipe.drop
      ? recipe.fill.boxShadow
        ? `${recipe.fill.boxShadow}, ${recipe.drop}`
        : recipe.drop
      : (recipe.fill.boxShadow ?? []),
  };
}

/**
 * The blur and the recipe's fill over it, clipped to the surface's corners.
 * Rendered as the surface's first child, so its content draws on top.
 */
export function GlassUnder({
  recipe,
  blur,
  target,
  radius,
  fadeIn = false,
}: {
  recipe: GlassRecipe;
  blur: number;
  target: RefObject<View | null> | null;
  radius: number | Pick<ViewStyle, 'borderTopLeftRadius' | 'borderTopRightRadius'>;
  fadeIn?: boolean;
}) {
  const backdropTarget = useContext(BlurTargetContext);
  if (blur === 0 || !target) return null;
  const clip = {
    ...(typeof radius === 'number' ? { borderRadius: radius } : radius),
    borderCurve: 'continuous',
    overflow: 'hidden',
  } as const;
  if (Platform.OS === 'android' && target === backdropTarget) {
    const tint =
      recipe.blurTint === 'dark'
        ? backdropMaterial.darkTint(blur)
        : backdropMaterial.defaultTint(blur);
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, clip, { backgroundColor: backdropMaterial.ground }]}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
        <View style={[StyleSheet.absoluteFill, clip, recipe.fill]} />
      </View>
    );
  }
  const key = blurTargetKey(target);
  const nativeBlur = (
    <BlurView
      key={key}
      pointerEvents="none"
      blurTarget={target}
      blurMethod="dimezisBlurView"
      intensity={blur}
      tint={recipe.blurTint}
      style={[StyleSheet.absoluteFill, clip]}
    >
      <View style={[StyleSheet.absoluteFill, clip, recipe.fill]} />
    </BlurView>
  );
  return Platform.OS === 'android' && fadeIn ? (
    <BlurFade key={key} clip={clip}>
      {nativeBlur}
    </BlurFade>
  ) : (
    nativeBlur
  );
}

function BlurFade({ children, clip }: { children: ReactNode; clip: ViewStyle }) {
  const opacitySV = useSharedValue(0);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    opacitySV.set(
      withTiming(1, { duration: motion.fast }, (finished) => {
        if (finished) scheduleOnRN(setSettled, true);
      }),
    );
    return () => cancelAnimation(opacitySV);
  }, [opacitySV]);
  const opacity = useAnimatedStyle(() => ({ opacity: opacitySV.get() }));
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, clip]}>
      {!settled ? <View style={[StyleSheet.absoluteFill, clip, controlEdgeDense]} /> : null}
      <Animated.View style={[StyleSheet.absoluteFill, opacity]}>{children}</Animated.View>
    </View>
  );
}
