import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import {
  ActionBar,
  ExerciseStill,
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
} from '@/components';
import { routineExercisesQuery, routineQuery } from '@/data/queries/routines';
import {
  routineSessionsQuery,
  sessionsTopSetsQuery,
  sessionsWithRecordsQuery,
} from '@/data/queries/sessions';
import { useRows } from '@/data/live';
import { useSessionRunning } from '@/data/running';
import { startSession } from '@/data/mutations/sessions';
import { useSettings } from '@/data/settings';
import { formatRest, formatSessionDuration, sessionDotTone } from '@/lib/time';
import { formatWeight, type Unit } from '@/lib/units';
import { formatTonnage, topSet } from '@/lib/volume';

/**
 * Lab 34 A2. A sibling of `(tabs)`, so the push loses the tab bar and the
 * primary action takes that plane.
 *
 * EST. TIME, VOLUME and the LAST THREE rail are all session-derived and land in
 * Phase 6. They are present and dim rather than hidden or invented (§0).
 */
export default function RoutineScreen() {
  const actionBar = useActionBarHeight();
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
  const { data: recentSessions } = useLiveQuery(
    useMemo(() => routineSessionsQuery(id), [id]),
    [id],
  );
  const runningNow = useSessionRunning();
  const running = runningNow === true;
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
    if (running || !routine || !lifts?.length) {
      if (running) router.replace('/live');
      return;
    }
    try {
      startSession({ routineId: routine.id });
    } catch {
      // A session started elsewhere between render and tap: resume it.
    }
    router.replace('/live');
  };
  // `lifts` is null until the query answers, and a routine with no lifts has
  // nothing to start. Both dim the button instead of explaining in a dialog.
  const cannotStart = runningNow === null || (!running && !lifts?.length);

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
      label: 'TIME',
      value: lastSession ? formatSessionDuration(lastSession.durationSec) : '—',
    },
    {
      label: 'VOLUME',
      value:
        lastSession && lastSession.totalVolumeKg != null
          ? formatTonnage(lastSession.totalVolumeKg, settings.weightUnit)
          : '—',
    },
  ];

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
          onBack={() => router.back()}
          right={<Icon name="dots" />}
        />

        <Section first pad={13}>
          <StatTiles items={tiles} surface="raised" />
        </Section>

        <Section label="EXERCISES" plated={false}>
          <RowPlates>
            {rows.map((lift, i) => (
              <RowPlate key={lift.id} onPress={() => router.push(`/exercise/${lift.exerciseId}`)}>
                <ListRow
                  grip
                  chevron={false}
                  thumb={<ExerciseStill exerciseId={lift.exerciseId} size={44} />}
                  quiet
                  title={lift.name}
                  meta={liftMeta(lift, settings.weightUnit)}
                />
              </RowPlate>
            ))}
            {lifts !== null && rows.length === 0 ? (
              <RowPlate
                onPress={() =>
                  router.push({ pathname: '/session/library', params: { routineId: id } })
                }
              >
                <ListRow title="Add exercise" />
              </RowPlate>
            ) : null}
          </RowPlates>
        </Section>

        {sessions.length ? (
          <Section label="LAST THREE" plated={false}>
            <Rail items={railItems} air={24} />
          </Section>
        ) : null}
      </Screen>
      <ActionBar
        primary={running ? 'Resume' : 'Start'}
        disabled={cannotStart}
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
