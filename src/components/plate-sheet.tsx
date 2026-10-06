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

/** The plates for the current set's load, one side of the bar. */
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
  const [barIndex, setBarIndex] = useState('0');
  const [configuring, setConfiguring] = useState(false);

  const counts = plateCounts[unit];
  const shape = SHAPE[unit];
  const palette = PLATE_COLORS[unit === 'kg' ? 'competition' : 'lb'];
  const label = unit.toUpperCase();
  const bar = BAR_WEIGHTS[unit][Number(barIndex)];
  const barOptions = BAR_WEIGHTS[unit].map((weight, i) => ({
    key: String(i),
    label: `${weight} ${label} BAR`,
  }));
  const load = loadInUnit(loadKg, unit);
  const { perSide, achieved, residual } = solveInUnit(loadKg, unit, bar, counts);
  const closest = residual !== 0 && load > bar;
  const sizes = PLATE_DENOMINATIONS[unit];
  const isDefault = sizes.every((s) => counts[s] === DEFAULT_PLATE_COUNTS[unit][s]);

  const setCount = (plate: number, n: number) => {
    tick();
    setSettings({ plateCounts: { ...plateCounts, [unit]: { ...counts, [plate]: n } } });
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ gap: space.within }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={text.label}>
            PLATES · {formatWeight(loadKg, unit)} {label}
          </Text>
          <TextButton
            label={configuring ? 'DONE' : 'CONFIGURE'}
            onPress={() => setConfiguring((c) => !c)}
          />
        </View>
        <View style={{ height: STRIP_HEIGHT, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 28, height: 12, backgroundColor: color.tick2 }} />
          {perSide.map((plate, i) => (
            <View
              // biome-ignore lint/suspicious/noArrayIndexKey: plates repeat, order is the identity
              key={i}
              style={{
                width: shape[plate].thickness,
                height: (STRIP_HEIGHT * shape[plate].diameterMm) / 450,
                marginLeft: 2,
                borderRadius: radius.chip / 4,
                backgroundColor: palette[plate],
              }}
            />
          ))}
          <View style={{ width: 40, height: 12, marginLeft: 2, backgroundColor: color.tick2 }} />
        </View>
        <Text style={text.body}>
          {load <= 0
            ? 'Set a load'
            : load < bar
              ? 'Under the bar'
              : perSide.length === 0
                ? 'Bar only'
                : `${perSide.map(num).join(' + ')} per side`}
        </Text>
        {closest ? (
          <Text style={[text.meta, { color: color.lo }]}>
            CLOSEST {num(achieved)} {label} · {num(residual)} SHORT
          </Text>
        ) : null}
        <Segmented options={barOptions} value={barIndex} onChange={setBarIndex} />
        {configuring ? (
          <View style={{ borderTopWidth: 0.5, borderTopColor: hairline.onPlate }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={text.label}>PLATES PER SIDE</Text>
              <TextButton
                label="RESET"
                disabled={isDefault}
                onPress={() =>
                  setSettings({
                    plateCounts: { ...plateCounts, [unit]: DEFAULT_PLATE_COUNTS[unit] },
                  })
                }
              />
            </View>
            {sizes.map((plate) => (
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
                  disabled={counts[plate] <= 0}
                  onPress={() => setCount(plate, counts[plate] - 1)}
                />
                <Text style={[text.num, { minWidth: 20, textAlign: 'center' }]}>
                  {counts[plate]}
                </Text>
                <StepButton
                  plus
                  label={`More ${plate} ${label} plates`}
                  disabled={counts[plate] >= PLATE_COUNT_MAX}
                  onPress={() => setCount(plate, counts[plate] + 1)}
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}
