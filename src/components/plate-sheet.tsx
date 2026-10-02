import { useState } from 'react';
import { Text, View } from 'react-native';

import { formatWeight } from '@/lib/units';
import { PLATE_COLORS, solvePlates } from '@/lib/plates';
import { color, radius, space, text } from '@/theme';

import { Segmented } from './segmented';
import { Sheet } from './sheet';

/** Real plate geometry, scaled: height is diameter, width is thickness. */
const DIAMETER_MM: Record<number, number> = {
  25: 450,
  20: 450,
  15: 450,
  10: 400,
  5: 325,
  2.5: 230,
  1.25: 190,
};
const THICKNESS: Record<number, number> = {
  25: 22,
  20: 19,
  15: 16,
  10: 13,
  5: 10,
  2.5: 8,
  1.25: 7,
};
const STRIP_HEIGHT = 104;
const BARS = [
  { key: '20', label: '20 KG BAR' },
  { key: '15', label: '15 KG BAR' },
] as const;

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
  const [bar, setBar] = useState<(typeof BARS)[number]['key']>('20');
  const barKg = Number(bar);
  const { perSide, achievedKg, residualKg } = solvePlates(loadKg, barKg);
  const closest = residualKg !== 0 && loadKg > barKg;

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ gap: space.within }}>
        <Text style={text.label}>PLATES · {formatWeight(loadKg)} KG</Text>
        <View style={{ height: STRIP_HEIGHT, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 28, height: 12, backgroundColor: color.tick2 }} />
          {perSide.map((kg, i) => (
            <View
              // biome-ignore lint/suspicious/noArrayIndexKey: plates repeat, order is the identity
              key={i}
              style={{
                width: THICKNESS[kg],
                height: (STRIP_HEIGHT * DIAMETER_MM[kg]) / 450,
                marginLeft: 2,
                borderRadius: radius.chip / 4,
                backgroundColor: PLATE_COLORS.competition[kg],
              }}
            />
          ))}
          <View style={{ width: 40, height: 12, marginLeft: 2, backgroundColor: color.tick2 }} />
        </View>
        <Text style={text.body}>
          {loadKg <= 0
            ? 'Set a load'
            : loadKg < barKg
              ? 'Under the bar'
              : perSide.length === 0
                ? 'Bar only'
                : `${perSide.map((kg) => formatWeight(kg)).join(' + ')} per side`}
        </Text>
        {closest ? (
          <Text style={[text.meta, { color: color.lo }]}>
            CLOSEST {formatWeight(achievedKg)} KG · {formatWeight(residualKg)} SHORT
          </Text>
        ) : null}
        <Segmented options={BARS} value={bar} onChange={setBar} />
      </View>
    </Sheet>
  );
}
