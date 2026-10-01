import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { DotTone } from '@/lib/time';
import { color, hairline } from '@/theme';

import { listMotion } from './listed';

type RailItem = {
  tone: DotTone;
  body: ReactNode;
  /** Optional — a rail node is not a target unless a screen makes it one. */
  onPress?: () => void;
};

/**
 * kit's `rail()` — chronological only: exercise history, session list, PR
 * timeline.
 *
 * Dots cut free of the line: the segment stops short of the dot above and
 * below it (a top and bottom margin, not `flex: 1` alone), which is what
 * makes a rail read as discrete events rather than a continuous measure.
 */
export function Rail({
  items,
  air,
  onPlate = false,
  animate = false,
}: {
  items: RailItem[];
  air: number;
  onPlate?: boolean;
  /** Rows fade in (the first eight, staggered) and reflow when the list changes. */
  animate?: boolean;
}) {
  return (
    <View>
      {items.map((item, i) => (
        <RailRow
          key={i}
          item={item}
          index={i}
          last={i === items.length - 1}
          air={air}
          onPlate={onPlate}
          animate={animate}
        />
      ))}
    </View>
  );
}

export function RailRow({
  item,
  index = 0,
  last,
  air,
  onPlate = false,
  animate = false,
}: {
  item: RailItem;
  index?: number;
  last: boolean;
  air: number;
  onPlate?: boolean;
  animate?: boolean;
}) {
  const segColor = onPlate ? hairline.onPlate : hairline.onGround;
  const body = (
    <View style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : air, gap: 8 }}>{item.body}</View>
  );

  return (
    <Animated.View
      style={{ flexDirection: 'row', gap: 14 }}
      {...(animate ? listMotion(index) : null)}
    >
      <View style={{ width: 11, flex: 0, alignItems: 'center' }}>
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 9999,
            marginTop: 5,
            backgroundColor: color[item.tone],
          }}
        />
        {last ? null : (
          <View style={{ flex: 1, width: 1, backgroundColor: segColor, marginVertical: 6 }} />
        )}
      </View>
      {item.onPress ? (
        <Pressable
          onPress={item.onPress}
          // A one-line row is ~20pt tall; the slop brings the target to 44.
          hitSlop={{ top: 12, bottom: 12 }}
          style={({ pressed }) => [{ flex: 1, minWidth: 0 }, pressed && { opacity: 0.7 }]}
        >
          {body}
        </Pressable>
      ) : (
        body
      )}
    </Animated.View>
  );
}

export type { RailItem };
