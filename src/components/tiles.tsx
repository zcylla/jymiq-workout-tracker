import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { color, radius, space, text, tileSurface } from '@/theme';

import { Waiting } from './waiting';

export type Tile = {
  label: string;
  value: string;
  /** Tone of the number itself. `lo` is the empty state. */
  tone?: 'hi' | 'mid' | 'lo' | 'accent' | 'done' | 'live';
  /** The micro-visual that sits to the right of the number — a Meter, usually. */
  visual?: ReactNode;
  /** A comparison under the number — a Delta, usually. */
  below?: ReactNode;
  /** The value is a placeholder for a query that has not answered; it breathes until it does. */
  pending?: boolean;
};

/** The one absent value in the app, and §0 draws an absent value dim. */
const DASH = '—';

/**
 * An em dash is the empty state whoever produced it, so the tile decides rather
 * than every caller — two of them had already disagreed about the same value.
 * An explicit `tone` still wins, for a dash that means something else.
 */
function toneOf(tile: Tile): NonNullable<Tile['tone']> {
  if (tile.tone) return tile.tone;
  return tile.value === DASH ? 'lo' : 'hi';
}

/**
 * Stat tiles, two per row, never four. Order inside a tile is label → number →
 * visual; a comparison attaches to the number it describes, never its own tile.
 */
export function StatTiles({
  items,
  columns = 2,
}: {
  items: Tile[];
  columns?: number;
  /** Legacy hints; every inner tile uses the same static neutral surface. */
  surface?: 'panel' | 'raised';
  glass?: boolean;
}) {
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
              style={[
                {
                  flex: 1,
                  gap: 5,
                  paddingVertical: 11,
                  paddingHorizontal: 12,
                  borderRadius: radius.tile,
                  borderCurve: 'continuous',
                },
                tileSurface,
              ]}
            >
              <Text style={text.label}>{tile.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TileValue tile={tile} />
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

function TileValue({ tile }: { tile: Tile }) {
  const value = (
    <Text
      style={[text.numTile, { color: color[toneOf(tile)], flexShrink: 1 }]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
    >
      {tile.value}
    </Text>
  );
  return tile.pending ? <Waiting>{value}</Waiting> : value;
}
