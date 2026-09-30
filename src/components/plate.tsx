import type { ReactNode } from 'react';
import { View } from 'react-native';

import { color, containment, radius } from '@/theme';

import { GlassHeroContext, GlassUnder, glassStyle, useGlass } from './glass';

/** kit's `panel()` gap — the air between stacked things inside one plate. */
const PLATE_GAP = 9;

const { backgroundColor: _fill, boxShadow: _edge, ...glassShell } = containment.groupedPlate;

/**
 * kit's `panel()`: a flat, opaque, lighter plate. Not a card and not glass.
 *
 * Apple's insetGrouped stacks two signals — a discrete lightness jump and a real
 * gap — and never relies on spacing alone, which is the mechanism the editorial
 * rule was missing. Opaque hex rather than a white overlay: a translucent wash
 * on a near-black ground starts reading as cheap frosted glass, and glass is
 * reserved for chrome.
 *
 * `tone="glass"` and `hero` both mark a screen's main card, which takes the glass trial.
 */
export function Plate({
  children,
  tone = 'raised',
  hero = false,
  pad,
}: {
  children: ReactNode;
  tone?: 'raised' | 'panel' | 'glass';
  hero?: boolean;
  pad?: number;
}) {
  const isHero = tone === 'glass' || hero;
  const { recipe, blur, target } = useGlass(isHero ? 'hero' : 'plate');
  return (
    <View
      style={[
        recipe ? [glassShell, glassStyle(recipe, blur)] : containment.groupedPlate,
        { gap: PLATE_GAP },
        !recipe && tone === 'panel' && { backgroundColor: color.panel },
        pad !== undefined && { padding: pad },
      ]}
    >
      {recipe ? (
        <GlassUnder recipe={recipe} blur={blur} target={target} radius={radius.plate} />
      ) : null}
      <GlassHeroContext.Provider value={isHero && recipe !== null}>
        {children}
      </GlassHeroContext.Provider>
    </View>
  );
}
