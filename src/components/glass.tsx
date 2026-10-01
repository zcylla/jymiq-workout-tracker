import { BlurView } from 'expo-blur';
import { createContext, type RefObject, useContext } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useGlassTrial } from '@/data/glass-trial';
import { type Element, glassOf } from '@/lib/glass-trial';
import { chromeGlass, controlGlass, type GlassRecipe, glassRecipes } from '@/theme';

/**
 * The screen's backdrop, wrapped in a `BlurTargetView`, when the trial blurs.
 * Null anywhere outside a `Screen` — the tab bar, the action bar, a sheet — so
 * those surfaces fall back to their recipe without a blur.
 */
export const BlurTargetContext = createContext<RefObject<View | null> | null>(null);

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
}: {
  recipe: GlassRecipe;
  blur: number;
  target: RefObject<View | null> | null;
  radius: number;
}) {
  if (blur === 0 || !target) return null;
  const clip = { borderRadius: radius, borderCurve: 'continuous', overflow: 'hidden' } as const;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, clip]}>
      <BlurView
        blurTarget={target}
        blurMethod="dimezisBlurView"
        intensity={blur}
        tint={recipe.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, clip, recipe.fill]} />
    </View>
  );
}
