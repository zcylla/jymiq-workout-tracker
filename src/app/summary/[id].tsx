import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import {
  ActionBar,
  Delta,
  ExerciseStill,
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
import { useSettings } from '@/data/settings';
import { formatPrValue, PR_LABELS } from '@/lib/pr';
import { sessionSummaryStats } from '@/lib/session-summary';
import { formatSessionDuration, sessionDateLabel } from '@/lib/time';
import { formatWeight, type Unit } from '@/lib/units';
import { countWorkingSets, formatTonnage, topSet, totalVolume } from '@/lib/volume';
import { color, space, text } from '@/theme';

const SUMMARY_STILL = 120;

/** Lab 36 C2. VS LAST was its own tile and is now the delta on VOLUME. */
export default function SummaryScreen() {
  const actionBar = useActionBarHeight();
  const settings = useSettings();
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
      value: formatTonnage(session?.totalVolumeKg ?? 0, settings.weightUnit),
      tone: 'hi',
      below: volumeDelta ? (
        <Delta value={volumeDelta.label} positive={volumeDelta.positive} />
      ) : undefined,
    },
    { label: 'SETS', value: String(session?.totalSets ?? 0), tone: 'hi' },
    { label: 'RECORDS', value: String(records.length), tone: 'accent' },
  ];

  const stats = sessionSummaryStats(allSets, session?.durationSec ?? null);
  const weightTiles: Tile[] = [];
  const activityTiles: Tile[] = [];
  const unitLabel = settings.weightUnit.toUpperCase();
  if (stats.heaviestSet != null) {
    weightTiles.push({
      label: 'HEAVIEST SET',
      value: `${formatWeight(stats.heaviestSet.weightKg!, settings.weightUnit)} ${unitLabel} × ${stats.heaviestSet.reps}`,
    });
  }
  if (stats.bestE1rmKg != null) {
    weightTiles.push({
      label: 'BEST EST 1RM',
      value: `${formatWeight(stats.bestE1rmKg, settings.weightUnit)} ${unitLabel}`,
    });
  }
  if (stats.totalReps != null) {
    activityTiles.push({ label: 'TOTAL REPS', value: String(stats.totalReps) });
  }
  if (stats.averageRpe != null) {
    activityTiles.push({ label: 'AVG RPE', value: stats.averageRpe.toFixed(1) });
  }
  if (stats.densityKgPerMinute != null) {
    activityTiles.push({
      label: 'DENSITY',
      value: `${formatTonnage(stats.densityKgPerMinute, settings.weightUnit)}/MIN`,
    });
  }

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
        exerciseId: ex.exerciseId,
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
              ? sessionDateLabel(session.endedAt ?? session.startedAt, { upper: true })
              : undefined
          }
          onBack={() => router.back()}
        />

        <Section first pad={13}>
          <View style={{ gap: space.row }}>
            <StatTiles items={tiles} surface="raised" />
            {weightTiles.length > 0 ? (
              <StatTiles items={weightTiles} columns={weightTiles.length} surface="raised" />
            ) : null}
            {activityTiles.length > 0 ? (
              <StatTiles items={activityTiles} columns={activityTiles.length} surface="raised" />
            ) : null}
          </View>
        </Section>

        {records.length > 0 ? (
          <Section label="RECORDS" pad={13}>
            <View style={{ gap: 11 }}>
              {records.map((r) => (
                <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Pill label="PR" />
                  <View style={{ gap: 2, flexShrink: 1 }}>
                    <Text style={text.rowName} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text style={text.meta}>{prCaption(r, settings.weightUnit)}</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={[text.numRow, { color: color.accent }]}>
                    {formatPrValue(r.category, r.value, settings.weightUnit)}
                  </Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        <Section label="LIFTS" plated={false}>
          {lifted.map((ex) => (
            <View
              key={ex.id}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 }}
            >
              <ExerciseStill exerciseId={ex.exerciseId} name={ex.name} size={SUMMARY_STILL} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={text.rowName}>{ex.name}</Text>
                <Text style={text.meta}>{ex.count} SETS</Text>
                {ex.top ? (
                  <Text style={text.meta}>
                    TOP {formatWeight(ex.top.weightKg ?? 0, settings.weightUnit)} {unitLabel} ×{' '}
                    {ex.top.reps}
                  </Text>
                ) : null}
                <Text style={text.meta}>{formatTonnage(ex.volumeKg, settings.weightUnit)}</Text>
              </View>
            </View>
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

function prCaption(r: PrRow, unit: Unit): string {
  const label =
    r.category === 'most_reps_at_weight' && r.weightKg != null
      ? `${PR_LABELS[r.category]} ${formatWeight(r.weightKg, unit)}`
      : PR_LABELS[r.category];
  if (r.previousValue == null) return label;
  return `${label} · WAS ${formatPrValue(r.category, r.previousValue, unit)}`;
}
