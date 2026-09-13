import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import type { DotTone } from '@/lib/time';
import { color, hairline } from '@/theme';

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
}: {
  items: RailItem[];
  air: number;
  onPlate?: boolean;
}) {
  const segColor = onPlate ? hairline.onPlate : hairline.onGround;

  return (
    <View>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        const body = (
          <View style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : air, gap: 8 }}>
            {item.body}
          </View>
        );
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 14 }}>
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
                style={({ pressed }) => [{ flex: 1, minWidth: 0 }, pressed && { opacity: 0.7 }]}
              >
                {body}
              </Pressable>
            ) : (
              body
            )}
          </View>
        );
      })}
    </View>
  );
}

export type { RailItem };
