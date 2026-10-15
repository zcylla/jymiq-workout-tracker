import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Delta,
  Icon,
  Plate,
  Screen,
  ScreenHeader,
  Section,
  StatTiles,
  type Tile,
} from '@/components';
import { EdgeChip } from '@/components/edge-chip';
import { BlurTargetContext } from '@/components/glass';
import {
  type ChipLook,
  chipLooks,
  color,
  radius,
  size,
  space,
  text,
  type TileLook,
  tileLooks,
} from '@/theme';

type TileChoice = keyof typeof tileLooks;
type ChipChoice = keyof typeof chipLooks;
type ParentChoice = 'hero' | 'grouped' | 'bare';

const TILE_OPTIONS = (Object.keys(tileLooks) as TileChoice[]).map((key) => ({
  key,
  label: `${key} · ${tileLooks[key].label}`,
}));
const CHIP_OPTIONS = (Object.keys(chipLooks) as ChipChoice[]).map((key) => ({
  key,
  label: `${key} · ${chipLooks[key].label}`,
}));
const PARENTS = [
  { key: 'hero', label: 'Hero plate' },
  { key: 'grouped', label: 'Grouped plate' },
  { key: 'bare', label: 'Bare ground' },
] as const;
const METRICS = [
  { key: 'e1rm', label: 'e1RM' },
  { key: 'volume', label: 'Volume' },
  { key: 'reps', label: 'Reps' },
] as const;
const PERIODS = [
  { key: '4w', label: '4W' },
  { key: '8w', label: '8W' },
  { key: '12w', label: '12W' },
] as const;
const NUMBERS: Tile[] = [
  { label: 'BEST e1RM', value: '166', tone: 'accent', visual: <Text style={text.label}>KG</Text> },
  { label: 'BEST SET', value: '142 KG × 5' },
  { label: 'SESSIONS', value: '24', visual: <Text style={text.label}>/ 12 WK</Text> },
  { label: 'FREQUENCY', value: '2.0', visual: <Text style={text.label}>/ WK</Text> },
];
const WEEK: Tile[] = [
  { label: 'BEST e1RM', value: '166 KG', below: <Delta value="+4 KG" /> },
  { label: 'VOLUME', value: '6.24 T', below: <Delta value="−0.32 T" positive={false} /> },
];

export default function TilesScreen() {
  const [tileChoice, setTileChoice] = useState<TileChoice>('T1');
  const [parent, setParent] = useState<ParentChoice>('hero');
  const [chipChoice, setChipChoice] = useState<ChipChoice>('C1');
  const [metric, setMetric] = useState<(typeof METRICS)[number]['key']>('e1rm');
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['key']>('8w');
  const look = tileLooks[tileChoice];
  const chip = chipLooks[chipChoice];

  return (
    <Screen>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={styles.back}
      >
        <Icon name="back" tone={color.mid} />
        <Text style={text.meta}>BACK</Text>
      </Pressable>
      <ScreenHeader title="Tile visibility" kicker="DEV · INNER TILES + CHIPS" />
      <Picker
        label="TILE LOOK"
        options={TILE_OPTIONS}
        value={tileChoice}
        onChange={setTileChoice}
      />
      <Picker label="PARENT SURFACE" options={PARENTS} value={parent} onChange={setParent} />
      <Picker
        label="CHIP ACTIVE STYLE"
        options={CHIP_OPTIONS}
        value={chipChoice}
        onChange={setChipChoice}
      />
      <View style={styles.caption}>
        <Text style={text.meta} numberOfLines={1}>
          {`${tileChoice} / ${chipChoice} · ${look.label} · ${chip.label}`}
        </Text>
        <Text style={text.meta}>BlurViews mounted · 0</Text>
      </View>

      <BlurTargetContext.Provider value={null}>
        <Section first label="YOUR NUMBERS" plated={false}>
          <Parent surface={parent}>
            <SampleTiles items={NUMBERS} choice={tileChoice} />
          </Parent>
        </Section>
        <Section label="THIS WEEK VS LAST WEEK" plated={false}>
          <Parent surface={parent}>
            <SampleTiles items={WEEK} choice={tileChoice} />
          </Parent>
        </Section>
        <Section label="GRAPH CHIPS" plated={false}>
          <Parent surface={parent}>
            <View style={styles.chipBlock}>
              <Text style={text.label}>METRIC</Text>
              <ChipRow
                options={METRICS}
                value={metric}
                onChange={setMetric}
                look={look}
                choice={chipChoice}
              />
              <Text style={text.label}>PERIOD</Text>
              <ChipRow
                options={PERIODS}
                value={period}
                onChange={setPeriod}
                look={look}
                choice={chipChoice}
                period
              />
            </View>
          </Parent>
        </Section>
      </BlurTargetContext.Provider>
    </Screen>
  );
}

function Picker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.controls}>
      <Text style={text.label}>{label}</Text>
      <View style={styles.picker}>
        {options.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: value === option.key }}
            style={[styles.choice, tileLooks.T1.fill, value === option.key && chipLooks.C1.fill]}
          >
            <Text style={[text.pill, { color: value === option.key ? color.accent : color.mid }]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Parent({ surface, children }: { surface: ParentChoice; children: ReactNode }) {
  if (surface === 'bare') return <View style={styles.bare}>{children}</View>;
  return (
    <Plate hero={surface === 'hero'} pad={13}>
      {children}
    </Plate>
  );
}

function SampleTiles({ items, choice }: { items: Tile[]; choice: TileChoice }) {
  if (choice === 'T0') return <StatTiles items={items} />;
  const rows = Array.from({ length: Math.ceil(items.length / 2) }, (_, i) =>
    items.slice(i * 2, i * 2 + 2),
  );
  return (
    <View style={styles.tiles}>
      {rows.map((row, index) => (
        <View key={index} style={styles.tileRow}>
          {row.map((tile) => (
            <View key={tile.label} style={[styles.tile, tileLooks[choice].fill]}>
              <Text style={text.label}>{tile.label}</Text>
              <View style={styles.valueRow}>
                <Text
                  style={[text.numTile, styles.value, { color: color[tile.tone ?? 'hi'] }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {tile.value}
                </Text>
                <View style={styles.spacer} />
                {tile.visual}
              </View>
              {tile.below ? <View style={styles.below}>{tile.below}</View> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
  look,
  choice,
  period = false,
}: {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  look: TileLook;
  choice: ChipChoice;
  period?: boolean;
}) {
  const recipe: ChipLook = chipLooks[choice];
  const height = period ? 32 : size.hit;
  const corner = period ? radius.row : radius.chip;
  const slop = (size.hit - height) / 2;
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const active = option.key === value;
        if (choice === 'C0') {
          return (
            <EdgeChip
              key={option.key}
              label={option.label}
              active={active}
              onPress={() => onChange(option.key)}
              height={height}
              radius={corner}
              minWidth={size.hit}
              hitSlop={{ top: slop, bottom: slop }}
            />
          );
        }
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            hitSlop={{ top: slop, bottom: slop }}
            style={[
              styles.chip,
              { height, borderRadius: corner },
              !active || recipe.useTileFill ? look.fill : null,
              active && recipe.fill,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[text.pill, { color: active ? recipe.activeLabel : color.mid }]}
            >
              {option.label}
            </Text>
            {active && recipe.bar ? (
              <View pointerEvents="none" style={[styles.bar, recipe.bar]} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    minHeight: size.hit,
    minWidth: size.hit,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.within,
  },
  controls: { gap: space.row, paddingTop: space.within },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: space.row },
  choice: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: size.hit,
    minWidth: size.hit,
    paddingHorizontal: space.within,
    paddingVertical: space.row,
    justifyContent: 'center',
    borderRadius: radius.chip,
    borderCurve: 'continuous',
  },
  caption: { gap: space.row, paddingVertical: space.within },
  bare: { padding: 13 },
  tiles: { gap: space.row },
  tileRow: { flexDirection: 'row', gap: space.row },
  tile: {
    flex: 1,
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radius.tile,
    borderCurve: 'continuous',
  },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { flexShrink: 1 },
  spacer: { flex: 1 },
  below: { flexDirection: 'row', paddingTop: 2 },
  chipBlock: { gap: space.within },
  chipRow: { flexDirection: 'row', gap: 6, minHeight: size.hit, alignItems: 'center' },
  chip: {
    flex: 1,
    minWidth: size.hit,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  bar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
