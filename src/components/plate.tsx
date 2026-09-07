import type { ReactNode } from 'react';
import { View } from 'react-native';

import { color, containment } from '@/theme';

/** kit's `panel()` gap — the air between stacked things inside one plate. */
const PLATE_GAP = 9;

/**
 * kit's `panel()`: a flat, opaque, lighter plate. Not a card and not glass.
 *
 * Apple's insetGrouped stacks two signals — a discrete lightness jump and a real
 * gap — and never relies on spacing alone, which is the mechanism the editorial
 * rule was missing. Opaque hex rather than a white overlay: a translucent wash
 * on a near-black ground starts reading as cheap frosted glass, and glass is
 * reserved for chrome.
 */
export function Plate({
  children,
  tone = 'raised',
  pad,
}: {
  children: ReactNode;
  tone?: 'raised' | 'panel';
  pad?: number;
}) {
  return (
    <View
      style={[
        containment.groupedPlate,
        { gap: PLATE_GAP },
        tone === 'panel' && { backgroundColor: color.panel },
        pad !== undefined && { padding: pad },
      ]}
    >
      {children}
    </View>
  );
}
