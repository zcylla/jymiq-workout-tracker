import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Text, View } from 'react-native';

import {
  ActionBar,
  Icon,
  ListRow,
  Pill,
  Rail,
  type RailItem,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  StatTiles,
  type Tile,
  useActionBarHeight,
} from '@/components';
import { routineExercisesQuery, routineQuery } from '@/data/queries/routines';
import {
  routineSessionsQuery,
  sessionsTopSetsQuery,
  sessionsWithRecordsQuery,
} from '@/data/queries/sessions';
import { startSession } from '@/data/mutations/sessions';
import {
  formatMinutes,
  formatRest,
  formatSessionDuration,
  sessionDateLabel,
  sessionDotTone,
} from '@/lib/time';
import { formatWeight } from '@/lib/units';
import { formatTonnage, topSet } from '@/lib/volume';
import { text } from '@/theme';

/**
 * Lab 34 A2. A sibling of `(tabs)`, so the push loses the tab bar and the
 * primary action takes that plane.
 *
 * EST. TIME, VOLUME and the LAST THREE rail are all session-derived and land in
 * Phase 6. They are present and dim rather than hidden or invented (§0).
 */
export default function RoutineScreen() {
  const actionBar = useActionBarHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: found } = useLiveQuery(
    useMemo(() => routineQuery(id), [id]),
    [id],
  );
  const { data: lifts } = useLiveQuery(
    useMemo(() => routineExercisesQuery(id), [id]),
    [id],
  );
  const { data: recentSessions, updatedAt: sessionsUpdatedAt } = useLiveQuery(
    useMemo(() => routineSessionsQuery(id), [id]),
    [id],
  );
  const routine = found?.[0];
  const rows = lifts ?? [];
  const sessions = recentSessions ?? [];
  const sessionIds = useMemo(() => (recentSessions ?? []).map((s) => s.id), [recentSessions]);
  const sessionIdsKey = sessionIds.join(',');

  const { data: topSetRows } = useLiveQuery(
    useMemo(() => sessionsTopSetsQuery(sessionIds), [sessionIds]),
    [sessionIdsKey],
  );
  const { data: recordedSessions } = useLiveQuery(
    useMemo(() => sessionsWithRecordsQuery(sessionIds), [sessionIds]),
    [sessionIdsKey],
  );

  const topSetsBySession = useMemo(() => {
    const bySession = new Map<string, TopSetRow[]>();
    for (const row of topSetRows ?? []) {
      const group = bySession.get(row.sessionId) ?? [];
      group.push(row);
      bySession.set(row.sessionId, group);
    }
    const result = new Map<string, ReturnType<typeof topSet>>();
    for (const [sessionId, group] of bySession) result.set(sessionId, topSet(group));
    return result;
  }, [topSetRows]);
  const recordedSessionIds = useMemo(
    () => new Set((recordedSessions ?? []).map((r) => r.sessionId)),
    [recordedSessions],
  );

  const start = () => {
    if (!routine || rows.length === 0) {
      Alert.alert(
        'Add an exercise first',
        'A routine needs at least one lift before it can start.',
      );
      return;
    }
    try {
      startSession({ routineId: routine.id });
      router.replace('/live');
    } catch {
      Alert.alert('A session is already running', 'Finish or discard it before starting another.');
    }
  };

  const sets = rows.reduce((n, l) => n + l.targetSets, 0);
  const lastSession = sessions[0];
  const tiles: Tile[] = [
    { label: 'EXERCISES', value: String(rows.length) },
    { label: 'SETS', value: String(sets) },
    lastSession
      ? { label: 'EST. TIME', value: formatSessionDuration(lastSession.durationSec) }
      : { label: 'EST. TIME', value: '—', tone: 'lo' },
    lastSession && lastSession.totalVolumeKg != null
      ? { label: 'VOLUME', value: formatTonnage(lastSession.totalVolumeKg) }
      : { label: 'VOLUME', value: '—', tone: 'lo' },
  ];

  const sessionsLoading = sessionsUpdatedAt === undefined;
  const railItems: RailItem[] = sessions.map((session) => ({
    tone: sessionDotTone(session.startedAt),
    body: (
      <SessionRow
        session={session}
        topSet={topSetsBySession.get(session.id) ?? null}
        hasRecord={recordedSessionIds.has(session.id)}
      />
    ),
  }));

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader
          title={routine?.name ?? ''}
          kicker="ROUTINE"
          onBack={() => router.back()}
          right={<Icon name="dots" />}
        />

        <Section first pad={13}>
          <StatTiles items={tiles} surface="raised" />
        </Section>

        <Section label="EXERCISES" plated={false}>
          {rows.length ? (
            <RowPlates>
              {rows.map((lift, i) => (
                <RowPlate key={lift.id} onPress={() => router.push(`/exercise/${lift.exerciseId}`)}>
                  <ListRow
                    grip
                    chevron={false}
                    lead={String(i + 1).padStart(2, '0')}
                    quiet
                    title={lift.name}
                    meta={liftMeta(lift)}
                  />
                </RowPlate>
              ))}
            </RowPlates>
          ) : (
            <Text style={text.prose}>
              No lifts yet. Add them from the library, or copy them from another routine.
            </Text>
          )}
        </Section>

        <Section label="LAST THREE" plated={false}>
          {sessions.length ? (
            <Rail items={railItems} air={24} />
          ) : sessionsLoading ? null : (
            <Text style={text.prose}>No sessions from this routine yet.</Text>
          )}
        </Section>
      </Screen>
      <ActionBar
        primary={routine ? `Start ${routine.name}` : 'Start'}
        secondary="EDIT"
        onPrimary={start}
        onSecondary={() => router.push(`/routine/${id}/edit`)}
      />
    </>
  );
}

type Lift = Awaited<ReturnType<typeof routineExercisesQuery>>[number];
type RoutineSession = Awaited<ReturnType<typeof routineSessionsQuery>>[number];
type TopSetRow = Awaited<ReturnType<typeof sessionsTopSetsQuery>>[number];

/** kit's `lift_row` meta: "5 × 8 @ 102.5 KG · REST 3:00". */
function liftMeta(lift: Lift): string {
  const parts = [
    lift.targetReps ? `${lift.targetSets} × ${lift.targetReps}` : `${lift.targetSets} SETS`,
  ];
  if (lift.targetWeightKg != null) parts[0] += ` @ ${formatWeight(lift.targetWeightKg)} KG`;
  if (lift.restSec != null) parts.push(`REST ${formatRest(lift.restSec)}`);
  return parts.join(' · ');
}

/** lab34.py:88-97's LAST THREE rail body: a two-line stack per session. */
function SessionRow({
  session,
  topSet: sessionTopSet,
  hasRecord,
}: {
  session: RoutineSession;
  topSet: ReturnType<typeof topSet>;
  hasRecord: boolean;
}) {
  const metaParts = [];
  const duration = formatSessionDuration(session.durationSec);
  if (duration !== '—') metaParts.push(formatMinutes(session.durationSec!));
  metaParts.push(`${session.totalSets ?? 0} SETS`);
  if (sessionTopSet) {
    metaParts.push(`TOP ${formatWeight(sessionTopSet.weightKg!)} × ${sessionTopSet.reps}`);
  }

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Text style={text.num}>{sessionDateLabel(session.startedAt)}</Text>
        {hasRecord ? <Pill label="PR" /> : null}
        <View style={{ flex: 1 }} />
        {session.totalVolumeKg != null ? (
          <Text style={text.numSm}>{formatTonnage(session.totalVolumeKg)}</Text>
        ) : null}
      </View>
      <Text style={text.meta}>{metaParts.join(' · ')}</Text>
    </>
  );
}
