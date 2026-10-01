import { type ReactNode, useContext } from 'react';
import { Text, View } from 'react-native';

import { color, radius, space, text } from '@/theme';

import { GlassHeroContext, GlassUnder, glassStyle, useControlGlass, useGlass } from './glass';
import { RollingNumber } from './rolling-number';
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
  surface = 'panel',
  glass = false,
}: {
  items: Tile[];
  columns?: number;
  /**
   * The surface the tiles sit on, not the tiles' own fill — a tile takes the
   * other colour so it reads as a step. Raised tiles on a raised plate are
   * invisible, which is kit's reason for inverting it here rather than at the
   * call site.
   */
  surface?: 'panel' | 'raised';
  /** Each tile wears the edge control look with blur, like a row. */
  glass?: boolean;
}) {
  const fill = surface === 'raised' ? color.panel : color.raised;
  const inHero = useContext(GlassHeroContext);
  const control = useControlGlass();
  const inner = useGlass('inner');
  const { recipe, blur, target } = glass ? control : inner;
  const tileSurface =
    glass && recipe ? glassStyle(recipe, blur) : inHero && recipe ? recipe.tile : null;

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
                  backgroundColor: fill,
                  borderRadius: radius.tile,
                  borderCurve: 'continuous',
                },
                tileSurface,
              ]}
            >
              {glass && recipe ? (
                <GlassUnder recipe={recipe} blur={blur} target={target} radius={radius.tile} />
              ) : null}
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

/** A plain integer rolls when it changes; anything with units or decimals is text. */
function TileValue({ tile }: { tile: Tile }) {
  const style = { ...text.numTile, color: color[toneOf(tile)] };
  if (/^\d+$/.test(tile.value) && !tile.pending)
    return <RollingNumber value={tile.value} style={style} />;
  const value = (
    <Text
      style={[style, { flexShrink: 1 }]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
    >
      {tile.value}
    </Text>
  );
  return tile.pending ? <Waiting>{value}</Waiting> : value;
}
