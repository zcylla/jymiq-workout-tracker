import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { setSettings, useSettings } from '@/data/settings';
import {
  BAR_WEIGHTS,
  DEFAULT_PLATE_COUNTS,
  loadInUnit,
  PLATE_COLORS,
  PLATE_COUNT_MAX,
  PLATE_DENOMINATIONS,
  solveInUnit,
  weighPlates,
} from '@/lib/plates';
import { formatWeight, type Unit } from '@/lib/units';
import { color, hairline, radius, size, space, text, wash } from '@/theme';
import { disabledControl } from '@/theme/tokens';

import { tick } from './haptics';
import { Segmented } from './segmented';
import { Sheet } from './sheet';

/** Real plate geometry, scaled: diameter is height, thickness is width. */
const SHAPE: Record<Unit, Record<number, { diameterMm: number; thickness: number }>> = {
  kg: {
    25: { diameterMm: 450, thickness: 22 },
    20: { diameterMm: 450, thickness: 19 },
    15: { diameterMm: 450, thickness: 16 },
    10: { diameterMm: 400, thickness: 13 },
    5: { diameterMm: 325, thickness: 10 },
    2.5: { diameterMm: 230, thickness: 8 },
    1.25: { diameterMm: 190, thickness: 7 },
  },
  lb: {
    45: { diameterMm: 450, thickness: 22 },
    35: { diameterMm: 400, thickness: 18 },
    25: { diameterMm: 340, thickness: 15 },
    10: { diameterMm: 260, thickness: 12 },
    5: { diameterMm: 200, thickness: 9 },
    2.5: { diameterMm: 165, thickness: 7 },
  },
};
const STRIP_HEIGHT = 104;
const SWATCH_HEIGHT = 28;
const STEP_BUTTON = 36;
const WEIGH_COUNT_MAX = 10;
const PALETTE = { kg: 'competition', lb: 'lb' } as const;

const num = (n: number) => String(Math.round(n * 100) / 100);

function Mark({ plus, tone }: { plus: boolean; tone: string }) {
  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: 14, height: 1.5, backgroundColor: tone }} />
      {plus ? (
        <View style={{ position: 'absolute', width: 1.5, height: 14, backgroundColor: tone }} />
      ) : null}
    </View>
  );
}

function StepButton({
  plus,
  disabled,
  label,
  onPress,
}: {
  plus: boolean;
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: size.hit,
        height: size.hit,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={[
          {
            width: STEP_BUTTON,
            height: STEP_BUTTON,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.row,
            borderCurve: 'continuous',
            backgroundColor: wash.field,
            borderWidth: 1,
            borderColor: hairline.onPlate,
          },
          disabled && disabledControl.surface,
        ]}
      >
        <Mark plus={plus} tone={disabled ? disabledControl.label : color.hi} />
      </View>
    </Pressable>
  );
}

function TextButton({
  label,
  disabled = false,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => ({
        minHeight: size.hit,
        paddingLeft: space.within,
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={[text.pill, disabled && { color: disabledControl.label }]}>{label}</Text>
    </Pressable>
  );
}

function PlateStrip({
  plates,
  unit,
  withBar,
}: {
  plates: readonly number[];
  unit: Unit;
  withBar: boolean;
}) {
  const shape = SHAPE[unit];
  const palette = PLATE_COLORS[PALETTE[unit]];
  return (
    <View style={{ height: STRIP_HEIGHT, flexDirection: 'row', alignItems: 'center' }}>
      {withBar ? <View style={{ width: 28, height: 12, backgroundColor: color.tick2 }} /> : null}
      {plates.map((plate, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: plates repeat, order is the identity
          key={i}
          style={{
            width: shape[plate].thickness,
            height: (STRIP_HEIGHT * shape[plate].diameterMm) / 450,
            flexShrink: 1,
            marginLeft: 2,
            borderRadius: radius.chip / 4,
            backgroundColor: palette[plate],
          }}
        />
      ))}
      {withBar ? (
        <View style={{ width: 40, height: 12, marginLeft: 2, backgroundColor: color.tick2 }} />
      ) : null}
    </View>
  );
}

function PlateStepper({
  unit,
  counts,
  max,
  resetDisabled,
  onReset,
  onChange,
}: {
  unit: Unit;
  counts: Record<number, number>;
  max: number;
  resetDisabled: boolean;
  onReset: () => void;
  onChange: (plate: number, n: number) => void;
}) {
  const shape = SHAPE[unit];
  const palette = PLATE_COLORS[PALETTE[unit]];
  const label = unit.toUpperCase();
  return (
    <View style={{ borderTopWidth: 0.5, borderTopColor: hairline.onPlate }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={text.label}>PLATES PER SIDE</Text>
        <TextButton label="RESET" disabled={resetDisabled} onPress={onReset} />
      </View>
      {PLATE_DENOMINATIONS[unit].map((plate) => {
        const n = counts[plate] ?? 0;
        return (
          <View
            key={plate}
            style={{
              minHeight: size.hit,
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.within,
            }}
          >
            <View
              style={{
                width: 28,
                height: SWATCH_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: shape[plate].thickness,
                  height: (SWATCH_HEIGHT * shape[plate].diameterMm) / 450,
                  borderRadius: radius.chip / 4,
                  backgroundColor: palette[plate],
                }}
              />
            </View>
            <Text style={[text.rowName, { flex: 1 }]}>
              {plate} {label}
            </Text>
            <StepButton
              plus={false}
              label={`Fewer ${plate} ${label} plates`}
              disabled={n <= 0}
              onPress={() => onChange(plate, n - 1)}
            />
            <Text style={[text.num, { minWidth: 20, textAlign: 'center' }]}>{n}</Text>
            <StepButton
              plus
              label={`More ${plate} ${label} plates`}
              disabled={n >= max}
              onPress={() => onChange(plate, n + 1)}
            />
          </View>
        );
      })}
    </View>
  );
}

type Mode = 'load' | 'weigh';

const MODES: readonly { key: Mode; label: string }[] = [
  { key: 'load', label: 'LOAD' },
  { key: 'weigh', label: 'WEIGH' },
];

/** The plates for the current set's load, one side of the bar — or what a pile of plates weighs. */
export function PlateSheet({
  open,
  onClose,
  loadKg,
}: {
  open: boolean;
  onClose: () => void;
  loadKg: number;
}) {
  const { weightUnit: unit, plateCounts } = useSettings();
  const [mode, setMode] = useState<Mode>('load');
  const [barIndex, setBarIndex] = useState('0');
  const [configuring, setConfiguring] = useState(false);
  const [weighed, setWeighed] = useState<Record<Unit, Record<number, number>>>({ kg: {}, lb: {} });

  const counts = plateCounts[unit];
  const weighCounts = weighed[unit];
  const label = unit.toUpperCase();
  const bar = BAR_WEIGHTS[unit][Number(barIndex)];
  const barOptions = BAR_WEIGHTS[unit].map((weight, i) => ({
    key: String(i),
    label: weight === 0 ? 'NO BAR' : `${weight} ${label} BAR`,
  }));
  const load = loadInUnit(loadKg, unit);
  const { perSide, achieved, residual } = solveInUnit(loadKg, unit, bar, counts);
  const closest = residual !== 0 && load > bar;
  const sizes = PLATE_DENOMINATIONS[unit];
  const isDefault = sizes.every((s) => counts[s] === DEFAULT_PLATE_COUNTS[unit][s]);
  const weighedPlates = sizes.flatMap((s) => Array.from({ length: weighCounts[s] ?? 0 }, () => s));
  const weighedSum = weighPlates(weighCounts, bar);

  const setCount = (plate: number, n: number) => {
    tick();
    setSettings({ plateCounts: { ...plateCounts, [unit]: { ...counts, [plate]: n } } });
  };
  const setWeighCount = (plate: number, n: number) => {
    tick();
    setWeighed({ ...weighed, [unit]: { ...weighCounts, [plate]: n } });
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ gap: space.within }}>
        <Segmented options={MODES} value={mode} onChange={setMode} />
        {mode === 'load' ? (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={text.label}>
                PLATES · {formatWeight(loadKg, unit)} {label}
              </Text>
              <TextButton
                label={configuring ? 'DONE' : 'CONFIGURE'}
                onPress={() => setConfiguring((c) => !c)}
              />
            </View>
            <PlateStrip plates={perSide} unit={unit} withBar={bar > 0} />
            <Text style={text.body}>
              {load <= 0
                ? 'Set a load'
                : load < bar
                  ? 'Under the bar'
                  : perSide.length === 0
                    ? bar === 0
                      ? 'No plate fits'
                      : 'Bar only'
                    : `${perSide.map(num).join(' + ')} per side`}
            </Text>
            {closest ? (
              <Text style={[text.meta, { color: color.lo }]}>
                CLOSEST {num(achieved)} {label} · {num(residual)} SHORT
              </Text>
            ) : null}
            <Segmented options={barOptions} value={barIndex} onChange={setBarIndex} />
            {configuring ? (
              <PlateStepper
                unit={unit}
                counts={counts}
                max={PLATE_COUNT_MAX}
                resetDisabled={isDefault}
                onReset={() =>
                  setSettings({
                    plateCounts: { ...plateCounts, [unit]: DEFAULT_PLATE_COUNTS[unit] },
                  })
                }
                onChange={setCount}
              />
            ) : null}
          </>
        ) : (
          <>
            <PlateStrip plates={weighedPlates} unit={unit} withBar={bar > 0} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <Text style={text.label}>TOTAL</Text>
              <Text style={text.numTile}>
                {num(weighedSum.total)} {label}
              </Text>
            </View>
            <Text style={text.meta}>
              PER SIDE {num(weighedSum.perSide)} {label} ·{' '}
              {bar === 0 ? 'NO BAR' : `BAR ${num(bar)} ${label}`}
            </Text>
            <Segmented options={barOptions} value={barIndex} onChange={setBarIndex} />
            <PlateStepper
              unit={unit}
              counts={weighCounts}
              max={WEIGH_COUNT_MAX}
              resetDisabled={weighedPlates.length === 0}
              onReset={() => setWeighed({ ...weighed, [unit]: {} })}
              onChange={setWeighCount}
            />
          </>
        )}
      </View>
    </Sheet>
  );
}
