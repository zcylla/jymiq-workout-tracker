import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  ActionBar,
  Field,
  ListRow,
  NumberSheet,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  Sheet,
  StatTiles,
  SwipeRow,
  TrendChart,
  useActionBarHeight,
  useDialog,
} from '@/components';
import { useRows } from '@/data/live';
import { deleteBodyweight, logBodyweight, updateBodyweight } from '@/data/mutations/bodyweight';
import { bodyWeightsQuery } from '@/data/queries/bodyweight';
import { useSettings } from '@/data/settings';
import {
  byMonth,
  dailyWeights,
  latest,
  resolveBodyweight,
  sevenDayAverage,
  thirtyDayChange,
} from '@/lib/bodyweight';
import { dateLabel, timeLabel } from '@/lib/time';
import { formatWeight, fromDisplay, toDisplay, toKg } from '@/lib/units';
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

const RECENT = 30;

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
  const show = useDialog();
  const settings = useSettings();
  const unit = settings.weightUnit;
  const unitLabel = unit.toUpperCase();

  const rows = useRows(
    useMemo(() => bodyWeightsQuery(), []),
    [],
  );
  const now = useMemo(() => (rows ? nowMs() : 0), [rows]);
  const days = useMemo(() => dailyWeights(rows ?? []), [rows]);

  const recent = useMemo(() => (rows ? [...rows].reverse().slice(0, RECENT) : []), [rows]);
  const [editing, setEditing] = useState<{ id: string; weightKg: number; open: boolean } | null>(
    null,
  );

  const remove = (id: string, weightKg: number, at: number) =>
    show({
      title: `Delete ${oneDecimal(toDisplay(weightKg, unit))} ${unitLabel} on ${dateLabel(at)}?`,
      actions: [
        { label: 'Delete', tone: 'destructive', onPress: () => deleteBodyweight(id) },
        { label: 'Cancel', tone: 'cancel' },
      ],
    });

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

        {recent.length ? (
          <Section label="READINGS" plated={false}>
            <RowPlates>
              {recent.map((r) => (
                <SwipeRow key={r.id} onDelete={() => remove(r.id, r.weightKg, r.measuredAt)}>
                  <RowPlate
                    onPress={() => setEditing({ id: r.id, weightKg: r.weightKg, open: true })}
                  >
                    <ListRow
                      title={dateLabel(r.measuredAt)}
                      meta={timeLabel(r.measuredAt)}
                      value={oneDecimal(toDisplay(r.weightKg, unit))}
                      valueLabel={unitLabel}
                    />
                  </RowPlate>
                </SwipeRow>
              ))}
            </RowPlates>
          </Section>
        ) : null}

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

      {editing ? (
        <NumberSheet
          key={`${editing.id}-${editing.open}`}
          open={editing.open}
          onClose={() => setEditing({ ...editing, open: false })}
          label="WEIGHT"
          unit={unitLabel}
          was={oneDecimal(toDisplay(editing.weightKg, unit))}
          resolve={(entered) => resolveBodyweight(entered, unit)}
          onConfirm={(value) => updateBodyweight(editing.id, toKg(value, unit))}
        />
      ) : null}

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
