import { createNanoIconSet } from 'react-native-nano-icons';
import { StyleSheet, View } from 'react-native';

import glyphMap from '@/../assets/icons/nanoicons/WorkoutIcons.glyphmap.json';
import { color, type Ink } from '@/theme';

/**
 * The icon set: Lucide paths, re-stroked to the boards' 1.6/22 ratio and
 * compiled to a subsetted font at prebuild by react-native-nano-icons.
 *
 * A glyph is one native text draw, which is what makes an icon in every row of a
 * long list cheap — a Skia canvas or an SVG subtree per row is not. The cost is
 * that the stroke is baked, so `assets/icons/ui/*.svg` sets it per icon to land
 * on kit's on-screen weight at the size that icon is actually drawn (see the
 * table in `scripts/build-icons.py`). There is no runtime weight prop.
 *
 * Editing `assets/icons/ui/` means a prebuild — the plugin fingerprints the
 * folder and regenerates the font.
 */
const NanoIcon = createNanoIconSet(glyphMap);

export type IconName = keyof typeof glyphMap.i;

export function Icon({
  name,
  size = 22,
  tone = color.lo,
}: {
  name: IconName;
  size?: number;
  /** Ink, never a raw string — the compiler is what keeps hexes out of screens. */
  tone?: Ink;
}) {
  return <NanoIcon name={name} size={size} color={tone} />;
}

/** The row and field chevron. Drawn at 13pt, so its glyph carries a heavier stroke. */
export function Chevron({ tone = color.lo }: { tone?: Ink }) {
  return <Icon name="chev" size={13} tone={tone} />;
}

const grip = StyleSheet.create({
  column: { width: 16, alignItems: 'center', gap: 3 },
  bar: { width: 13, height: 1.5, borderRadius: 1 },
});

/**
 * The reorder handle. Three plain Views rather than a glyph: it is kit's own
 * drawing, not a Lucide icon, and three Views are cheaper than a text draw.
 */
export function Grip({ tone = color.dim }: { tone?: Ink }) {
  return (
    <View style={grip.column}>
      <View style={[grip.bar, { backgroundColor: tone }]} />
      <View style={[grip.bar, { backgroundColor: tone }]} />
      <View style={[grip.bar, { backgroundColor: tone }]} />
    </View>
  );
}
