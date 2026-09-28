import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { BodyMap, ListRow, RowPlate, RowPlates, Screen, ScreenHeader, Section } from '@/components';
import { useRows } from '@/data/live';
import { fatigueSetsQuery } from '@/data/queries/fatigue';
import { hardest, loadByMuscle, relativeLoad, WINDOW_DAYS } from '@/lib/fatigue';
import { heat, space, text, wash } from '@/theme';

const DAY = 86_400_000;
const GAP = 4;
const SCALE = [0, 0.25, 0.5, 0.75, 1];

export default function BodyScreen() {
  const { width } = useWindowDimensions();
  const figure = Math.min(160, (width - 2 * space.pad - GAP) / 2);

  const now = useMemo(() => nowMs(), []);
  const rows = useRows(
    useMemo(() => fatigueSetsQuery(now - WINDOW_DAYS * DAY), [now]),
    [now],
  );

  const relative = useMemo(() => relativeLoad(loadByMuscle(rows ?? [], now)), [rows, now]);
  const top = useMemo(() => hardest(rows ?? [], now), [rows, now]);

  return (
    <Screen>
      <ScreenHeader title="Body" kicker="FATIGUE" onBack={() => router.back()} />

      <Section first plated={false}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: GAP }}>
            <View style={{ width: figure, alignItems: 'center' }}>
              <BodyMap view="front" relative={relative} width={figure} />
              <Text style={[text.label, { paddingTop: 2 }]}>FRONT</Text>
            </View>
            <View style={{ width: figure, alignItems: 'center' }}>
              <BodyMap view="back" relative={relative} width={figure} />
              <Text style={[text.label, { paddingTop: 2 }]}>BACK</Text>
            </View>
          </View>
        </View>
        <View style={{ paddingTop: 14, gap: 6 }}>
          <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden' }}>
            {SCALE.map((v) => (
              <View key={v} style={{ flex: 1, backgroundColor: heat(v) }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={text.label}>LESS WORKED</Text>
            <Text style={text.label}>MOST WORKED</Text>
          </View>
        </View>
      </Section>

      <Section label="WORKED HARDEST" plated={false}>
        {top.length ? (
          <RowPlates>
            {top.map((m) => (
              <RowPlate key={m.muscle}>
                <ListRow
                  title={m.name}
                  meta={`${m.sets} SETS / ${WINDOW_DAYS} DAYS`}
                  chevron={false}
                  right={<HeatMeter value={m.relative} />}
                />
              </RowPlate>
            ))}
          </RowPlates>
        ) : rows === null ? null : (
          <Text style={text.prose}>Nothing trained in the last 7 days.</Text>
        )}
      </Section>
    </Screen>
  );
}

function nowMs(): number {
  return Date.now();
}

function HeatMeter({ value }: { value: number }) {
  return (
    <View
      style={{
        width: 54,
        height: 5,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: wash.track,
      }}
    >
      <View
        style={{ width: value * 54, height: 5, borderRadius: 3, backgroundColor: heat(value) }}
      />
    </View>
  );
}
