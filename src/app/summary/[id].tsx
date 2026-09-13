import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import {
  ActionBar,
  Delta,
  ListRow,
  Pill,
  Screen,
  ScreenHeader,
  Section,
  StatTiles,
  type Tile,
  useActionBarHeight,
} from '@/components';
import {
  previousSessionVolumeQuery,
  sessionLogExercisesQuery,
  sessionQuery,
  sessionRecordsQuery,
  sessionSetsQuery,
} from '@/data/queries/sessions';
import { formatPrValue, PR_LABELS } from '@/lib/pr';
import { formatSessionDuration, sessionDateLabel } from '@/lib/time';
import { formatWeight } from '@/lib/units';
import { countWorkingSets, formatTonnage, topSet, totalVolume } from '@/lib/volume';
import { color, text } from '@/theme';

/** Lab 36 C2. VS LAST was its own tile and is now the delta on VOLUME. */
export default function SummaryScreen() {
  const actionBar = useActionBarHeight();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: found } = useLiveQuery(
    useMemo(() => sessionQuery(id), [id]),
    [id],
  );
  const session = found?.[0];

  const { data: recordRows } = useLiveQuery(
    useMemo(() => sessionRecordsQuery(id), [id]),
    [id],
  );
  const records = recordRows ?? [];

  const { data: exerciseRows } = useLiveQuery(
    useMemo(() => sessionLogExercisesQuery(id), [id]),
    [id],
  );
  const exercises = exerciseRows ?? [];

  const { data: setRows } = useLiveQuery(
    useMemo(() => sessionSetsQuery(id), [id]),
    [id],
  );
  const allSets = setRows ?? [];

  const routineId = session?.routineId ?? '';
  const startedAt = session?.startedAt ?? 0;
  const { data: prevRows } = useLiveQuery(
    useMemo(() => previousSessionVolumeQuery(routineId, startedAt), [routineId, startedAt]),
    [routineId, startedAt],
  );
  const previousVolumeKg =
    session?.routineId != null ? (prevRows?.[0]?.totalVolumeKg ?? null) : null;

  const volumeDelta =
    previousVolumeKg != null && previousVolumeKg > 0 && session?.totalVolumeKg != null
      ? volumeDeltaOf(session.totalVolumeKg, previousVolumeKg)
      : null;

  const durationLabel = formatSessionDuration(session?.durationSec ?? null);
  const tiles: Tile[] = [
    { label: 'TIME', value: durationLabel },
    {
      label: 'VOLUME',
      value: formatTonnage(session?.totalVolumeKg ?? 0),
      tone: 'hi',
      below: volumeDelta ? (
        <Delta value={volumeDelta.label} positive={volumeDelta.positive} />
      ) : undefined,
    },
    { label: 'SETS', value: String(session?.totalSets ?? 0), tone: 'hi' },
    { label: 'RECORDS', value: String(records.length), tone: 'accent' },
  ];

  const setsByExercise = new Map<string, typeof allSets>();
  for (const s of allSets) {
    const list = setsByExercise.get(s.sessionExerciseId) ?? [];
    list.push(s);
    setsByExercise.set(s.sessionExerciseId, list);
  }

  // An exercise nobody touched was not lifted, and this section says what was.
  const lifted = exercises.flatMap((ex) => {
    const exSets = setsByExercise.get(ex.id) ?? [];
    const count = countWorkingSets(exSets);
    if (count === 0) return [];
    return [
      {
        id: ex.id,
        name: ex.name,
        count,
        top: topSet(exSets),
        volumeKg: totalVolume(exSets),
      },
    ];
  });

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader
          title={session?.name ?? ''}
          kicker={
            session
              ? `SESSION COMPLETE · ${sessionDateLabel(session.endedAt ?? session.startedAt, { upper: true })}`
              : undefined
          }
          onBack={() => router.back()}
        />

        <Section first pad={13}>
          <StatTiles items={tiles} surface="raised" />
        </Section>

        {records.length > 0 ? (
          <Section label="NEW RECORDS" pad={13}>
            <View style={{ gap: 11 }}>
              {records.map((r) => (
                <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Pill label="PR" />
                  <View style={{ gap: 2, flexShrink: 1 }}>
                    <Text style={text.rowName} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text style={text.meta}>{prCaption(r)}</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={[text.numRow, { color: color.accent }]}>
                    {formatPrValue(r.category, r.value)}
                  </Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        <Section label="WHAT YOU LIFTED" plated={false}>
          {lifted.map((ex, i) => (
            <ListRow
              key={ex.id}
              chevron={false}
              lead={String(i + 1).padStart(2, '0')}
              title={ex.name}
              meta={`${ex.count} SETS${ex.top ? ` · TOP ${formatWeight(ex.top.weightKg ?? 0)} × ${ex.top.reps}` : ''} · ${formatTonnage(ex.volumeKg)}`}
            />
          ))}
        </Section>
      </Screen>
      <ActionBar primary="Done" onPrimary={() => router.dismissTo('/')} />
    </>
  );
}

function volumeDeltaOf(
  currentKg: number,
  previousKg: number,
): { label: string; positive: boolean } {
  const pct = ((currentKg - previousKg) / previousKg) * 100;
  const positive = pct >= 0;
  return { label: `${positive ? '+' : ''}${pct.toFixed(1)}%`, positive };
}

type PrRow = Awaited<ReturnType<typeof sessionRecordsQuery>>[number];

function prCaption(r: PrRow): string {
  const label =
    r.category === 'most_reps_at_weight' && r.weightKg != null
      ? `${PR_LABELS[r.category]} ${formatWeight(r.weightKg)}`
      : PR_LABELS[r.category];
  if (r.previousValue == null) return label;
  return `${label} · WAS ${formatPrValue(r.category, r.previousValue)}`;
}
