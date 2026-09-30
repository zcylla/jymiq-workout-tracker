import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  ActionBar,
  Field,
  Screen,
  ScreenHeader,
  Section,
  Sheet,
  StatTiles,
  TrendChart,
  useActionBarHeight,
} from '@/components';
import { useRows } from '@/data/live';
import { logBodyweight } from '@/data/mutations/bodyweight';
import { bodyWeightsQuery } from '@/data/queries/bodyweight';
import { useSettings } from '@/data/settings';
import { byMonth, dailyWeights, latest, sevenDayAverage, thirtyDayChange } from '@/lib/bodyweight';
import { formatWeight, fromDisplay, toDisplay } from '@/lib/units';
import { color, hairline, radius, space, text, wash } from '@/theme';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const oneDecimal = (v: number) => (Math.round(v * 10) / 10).toFixed(1);
const signed = (v: number) => `${v < 0 ? '−' : '+'}${oneDecimal(Math.abs(v))}`;

/**
 * Lab 37 D2. RELATIVE STRENGTH is not built: it needs strength-standard tables
 * that nobody has sourced. The change under 7-DAY AVG is plain text rather than
 * a `Delta` — Delta paints up green and down red, and whether gaining weight is
 * good depends on a goal the app does not know.
 */
export default function BodyweightScreen() {
  const actionBar = useActionBarHeight();
  const settings = useSettings();
  const unit = settings.weightUnit;
  const unitLabel = unit.toUpperCase();

  const rows = useRows(
    useMemo(() => bodyWeightsQuery(), []),
    [],
  );
  const now = useMemo(() => (rows ? nowMs() : 0), [rows]);
  const days = useMemo(() => dailyWeights(rows ?? []), [rows]);

  const [logging, setLogging] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);

  const latestKg = rows ? latest(rows) : null;
  const averageKg = sevenDayAverage(days, now);
  const changeKg = thirtyDayChange(days, now);
  const months = useMemo(() => byMonth(days), [days]);

  const close = () => {
    setLogging(false);
    setTyped('');
    setError(null);
  };

  const save = () => {
    const value = Number.parseFloat(typed.replace(',', '.'));
    try {
      logBodyweight(fromDisplay(value, unit));
      close();
    } catch {
      setError(`${formatWeight(20, unit)}–${formatWeight(350, unit)} ${unitLabel}`);
    }
  };

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader title="Bodyweight" onBack={() => router.back()} />

        <Section first pad={13}>
          <StatTiles
            surface="raised"
            items={[
              {
                label: 'LATEST',
                value: latestKg === null ? '—' : oneDecimal(toDisplay(latestKg, unit)),
              },
              {
                label: '7-DAY AVG',
                value: averageKg === null ? '—' : oneDecimal(toDisplay(averageKg, unit)),
                tone: 'accent',
                below:
                  changeKg === null ? undefined : (
                    <Text style={[text.numSm, { color: color.mid }]}>
                      {`${signed(toDisplay(changeKg, unit))} ${unitLabel} · 30 DAYS`}
                    </Text>
                  ),
              },
            ]}
          />
        </Section>

        <Section label={`LAST 14 DAYS · ${unitLabel}`} plated={false}>
          {rows === null ? null : <TrendChart days={days} now={now} />}
        </Section>

        {months.length ? (
          <Section label="BY MONTH" plated={false}>
            {months.map((m) => (
              <View
                key={`${m.year}-${m.month}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 44,
                  paddingVertical: 7,
                }}
              >
                <Text style={[text.body, { flexShrink: 1 }]} numberOfLines={1}>
                  {MONTHS[m.month]}
                </Text>
                <Text style={text.meta}>{m.count}</Text>
                <View style={{ flex: 1 }} />
                <Text style={text.num}>{oneDecimal(toDisplay(m.averageKg, unit))}</Text>
                <Text style={[text.numSm, { width: 44, textAlign: 'right' }]}>
                  {m.changeKg === null ? '' : signed(toDisplay(m.changeKg, unit))}
                </Text>
              </View>
            ))}
          </Section>
        ) : null}
      </Screen>

      <ActionBar primary="Log weight" onPrimary={() => setLogging(true)} />

      <Sheet open={logging} onClose={close}>
        <Field
          label={`WEIGHT · ${unitLabel}`}
          value={typed}
          onChangeText={(next) => {
            setTyped(next);
            setError(null);
          }}
          keyboard="decimal"
          prompt={`${formatWeight(20, unit)}–${formatWeight(350, unit)}`}
          autoFocus
        />
        {error ? <Text style={[text.meta, { color: color.live }]}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={save}
          style={({ pressed }) => ({
            minHeight: 44,
            marginTop: space.within,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.row,
            borderCurve: 'continuous',
            backgroundColor: wash.field,
            borderWidth: 1,
            borderColor: hairline.onPlate,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={text.rowName}>Save</Text>
        </Pressable>
      </Sheet>
    </>
  );
}

function nowMs(): number {
  return Date.now();
}
