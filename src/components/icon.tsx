import { HugeiconsIcon } from '@hugeicons/react-native';
import { StyleSheet, View } from 'react-native';

import { color, type Ink } from '@/theme';

import { ICON_MAP } from './icon-map';
import { ICON_SIZE, ICON_STROKE_WIDTH, type IconName } from './icon-sizes';

export type { IconName } from './icon-sizes';

/** Free Hugeicons Stroke Rounded, calibrated to the original on-screen weights. */
export function Icon({
  name,
  size,
  tone = color.lo,
}: {
  name: IconName;
  /** Defaults to ICON_SIZE[name]; overrides scale the stroke with the icon. */
  size?: number;
  /** Ink, never a raw string — the compiler is what keeps hexes out of screens. */
  tone?: Ink;
}) {
  return (
    <HugeiconsIcon
      icon={ICON_MAP[name]}
      size={size ?? ICON_SIZE[name]}
      color={tone}
      strokeWidth={ICON_STROKE_WIDTH[name]}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** The row and field chevron, calibrated to 1.38pt on screen at 13pt. */
export function Chevron({ tone = color.lo }: { tone?: Ink }) {
  return <Icon name="chev" tone={tone} />;
}

const grip = StyleSheet.create({
  column: { width: 16, alignItems: 'center', gap: 3 },
  bar: { width: 13, height: 1.5, borderRadius: 1 },
});

/**
 * The reorder handle remains kit's two plain Views.
 */
export function Grip({ tone = color.dim }: { tone?: Ink }) {
  return (
    <View style={grip.column}>
      <View style={[grip.bar, { backgroundColor: tone }]} />
      <View style={[grip.bar, { backgroundColor: tone }]} />
    </View>
  );
}
