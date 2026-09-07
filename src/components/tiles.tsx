import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { color, radius, space, text } from '@/theme';

export type Tile = {
  label: string;
  value: string;
  /** Tone of the number itself. `lo` is the empty state. */
  tone?: 'hi' | 'mid' | 'lo' | 'accent' | 'done' | 'live';
  /** The micro-visual that sits to the right of the number — a Meter, usually. */
  visual?: ReactNode;
  /** A comparison under the number — a Delta, usually. */
  below?: ReactNode;
};

/**
 * Stat tiles, two per row, never four. Order inside a tile is label → number →
 * visual; a comparison attaches to the number it describes, never its own tile.
 */
export function StatTiles({ items, columns = 2 }: { items: Tile[]; columns?: number }) {
  // Chunked rather than wrapped: flexWrap would stretch a short last row.
  const rows: Tile[][] = [];
  for (let i = 0; i < items.length; i += columns) rows.push(items.slice(i, i + columns));

  return (
    <View style={{ gap: space.row }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: space.row }}>
          {row.map((tile, c) => (
            <View
              key={c}
              style={{
                flex: 1,
                gap: 5,
                paddingVertical: 11,
                paddingHorizontal: 12,
                backgroundColor: color.raised,
                borderRadius: radius.tile,
                borderCurve: 'continuous',
              }}
            >
              <Text style={text.label}>{tile.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[text.numTile, { color: color[tile.tone ?? 'hi'] }]}>
                  {tile.value}
                </Text>
                <View style={{ flex: 1 }} />
                {tile.visual}
              </View>
              {tile.below ? (
                <View style={{ flexDirection: 'row', paddingTop: 2 }}>{tile.below}</View>
              ) : null}
            </View>
          ))}
          {Array.from({ length: columns - row.length }, (_, s) => (
            <View key={`pad${s}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}
