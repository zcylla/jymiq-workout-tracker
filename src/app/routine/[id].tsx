import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text } from 'react-native';

import {
  ActionBar,
  Icon,
  ListRow,
  Rail,
  type RailItem,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  SessionRow,
  StatTiles,
  type Tile,
  useActionBarHeight,
  useDialog,
} from '@/components';
import { routineExercisesQuery, routineQuery } from '@/data/queries/routines';
import {
  routineSessionsQuery,
  sessionsTopSetsQuery,
  sessionsWithRecordsQuery,
} from '@/data/queries/sessions';
import { useRows } from '@/data/live';
import { startSession } from '@/data/mutations/sessions';
import { useSettings } from '@/data/settings';
import { formatRest, formatSessionDuration, sessionDotTone } from '@/lib/time';
import { formatWeight, type Unit } from '@/lib/units';
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
  const show = useDialog();
  const settings = useSettings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: found } = useLiveQuery(
    useMemo(() => routineQuery(id), [id]),
    [id],
  );
  const lifts = useRows(
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
    // `lifts` is null until the query answers. Refusing on that told the user
    // their routine was empty because the app had not looked yet.
    if (lifts === null) return;
    if (!routine || lifts.length === 0) {
      show({
        title: 'Add an exercise first',
        message: 'A routine needs at least one lift before it can start.',
      });
      return;
    }
    try {
      startSession({ routineId: routine.id });
      router.replace('/live');
    } catch {
      show({
        title: 'A session is already running',
        message: 'Finish or discard it before starting another.',
      });
    }
  };

  const sets = rows.reduce((n, l) => n + l.targetSets, 0);
  const lastSession = sessions[0];
  // `data` starts as [], so without this the block paints a confident
  // EXERCISES 0 · SETS 0 before the lifts arrive. `updatedAt` is the only
  // loading signal drizzle gives us.
  const liftsLoading = lifts === null;
  // The bottom two describe the last session, not the plan, and they say so.
  // The board's EST. TIME / VOLUME are plan figures; computing those needs load
  // semantics for bodyweight and assisted lifts that the schema cannot express,
  // so the honest fix is to label what we actually have.
  const tiles: Tile[] = [
    { label: 'EXERCISES', value: liftsLoading ? '—' : String(rows.length) },
    { label: 'SETS', value: liftsLoading ? '—' : String(sets) },
    {
      label: 'LAST TIME',
      value: lastSession ? formatSessionDuration(lastSession.durationSec) : '—',
    },
    {
      label: 'LAST VOLUME',
      value:
        lastSession && lastSession.totalVolumeKg != null
          ? formatTonnage(lastSession.totalVolumeKg, settings.weightUnit)
          : '—',
    },
  ];

  const sessionsLoading = sessionsUpdatedAt === undefined;
  const railItems: RailItem[] = sessions.map((session) => ({
    tone: sessionDotTone(session.startedAt),
    body: (
      <SessionRow
        startedAt={session.startedAt}
        durationSec={session.durationSec}
        totalSets={session.totalSets}
        totalVolumeKg={session.totalVolumeKg}
        topSet={topSetsBySession.get(session.id) ?? null}
        hasRecord={recordedSessionIds.has(session.id)}
        unit={settings.weightUnit}
      />
    ),
    onPress: () => router.push(`/history/${session.id}`),
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
                    meta={liftMeta(lift, settings.weightUnit)}
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
type TopSetRow = Awaited<ReturnType<typeof sessionsTopSetsQuery>>[number];

/** kit's `lift_row` meta: "5 × 8 @ 102.5 KG · REST 3:00". */
function liftMeta(lift: Lift, unit: Unit): string {
  const parts = [
    lift.targetReps ? `${lift.targetSets} × ${lift.targetReps}` : `${lift.targetSets} SETS`,
  ];
  if (lift.targetWeightKg != null) {
    parts[0] += ` @ ${formatWeight(lift.targetWeightKg, unit)} ${unit.toUpperCase()}`;
  }
  if (lift.restSec != null) parts.push(`REST ${formatRest(lift.restSec)}`);
  return parts.join(' · ');
}
