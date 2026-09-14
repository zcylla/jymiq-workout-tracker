import { Link, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  Delta,
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
  WeekStrip,
  useDialog,
  useTabBarHeight,
} from '@/components';
import { useRows } from '@/data/live';
import { startSession } from '@/data/mutations/sessions';
import { sessionsInRangeQuery } from '@/data/queries/calendar';
import { routineExercisesQuery, routineListQuery } from '@/data/queries/routines';
import { recentSessionsQuery, sessionsWithRecordsQuery } from '@/data/queries/sessions';
import { lastRunPerRoutineQuery } from '@/data/queries/today';
import { trainedDays } from '@/lib/calendar';
import { lastRunLabel, pickNextRoutine } from '@/lib/next';
import { dateLabel, sessionDotTone } from '@/lib/time';
import { formatTonnage } from '@/lib/volume';
import { type StripDay, weekStrip } from '@/lib/week';
import { color, fabShadow, radius, text } from '@/theme';

/**
 * Today — Lab 45 W3. The next routine on a quiet raised card with a full-width
 * accent Start, the scrollable week strip whose fill is the graph, and the
 * recent-sessions rail.
 *
 * §0 gives it no records section: the rail's PR pill already says it and the
 * timeline lives on Strength.
 */
export default function TodayScreen() {
  const tabBar = useTabBarHeight();

  // One call: the cells, the query range and the two weeks' totals all come out
  // of the same arithmetic, so they cannot disagree about which days are in view.
  // Empty first, only for its range and its clock.
  const strip = useMemo(() => weekStrip(new Map()), []);

  const rangeRows = useRows(
    useMemo(() => sessionsInRangeQuery(strip.from, strip.to), [strip.from, strip.to]),
    [strip.from, strip.to],
  );
  const week = useMemo(() => weekStrip(trainedDays(rangeRows ?? [])), [rangeRows]);

  const routines = useRows(
    useMemo(() => routineListQuery(), []),
    [],
  );
  const lastRuns = useRows(
    useMemo(() => lastRunPerRoutineQuery(), []),
    [],
  );

  /**
   * `null` until both have answered. Deciding "no routines yet" off a list that
   * has not loaded is what made the tab the app opens on flash its empty state
   * on every launch.
   */
  const next = useMemo(() => {
    if (routines === null || lastRuns === null) return null;
    const byRoutine = new Map<string, number>();
    for (const row of lastRuns) {
      if (row.routineId && row.lastRunAt != null) byRoutine.set(row.routineId, row.lastRunAt);
    }
    return pickNextRoutine(routines, byRoutine);
  }, [routines, lastRuns]);

  return (
    <Screen bottomInset={tabBar}>
      {/* Settings is not a tab (§0) — it is this gear. Until that screen exists
          the gear opens the one thing behind it that does: the account. */}
      <ScreenHeader
        title="Today"
        kicker={dateLabel(strip.todayAt).toUpperCase()}
        right={
          <Pressable onPress={() => router.push('/sign-in')} hitSlop={12}>
            <Icon name="gear" />
          </Pressable>
        }
      />

      <NextCard next={next} loading={routines === null || lastRuns === null} />

      <Section label="THIS WEEK" pad={13}>
        <WeekStrip
          days={week.days}
          maxVolumeKg={week.maxVolumeKg}
          onPressDay={(day: StripDay) => router.push(`/history/${day.sessionId}`)}
        />
        <View style={{ height: 11 }} />
        <WeekTiles week={week} />
      </Section>

      <RecentRail />

      {__DEV__ ? <DevLinks /> : null}
    </Screen>
  );
}

/**
 * Lab 44 U4 — the quiet card with the accent spent on the action inside it,
 * rather than a filled accent slab. It survives a bad screen-brightness moment,
 * and the tab bar's start button stays the only other accent fill on the screen.
 */
function NextCard({
  next,
  loading,
}: {
  next: ReturnType<typeof pickNextRoutine>;
  loading: boolean;
}) {
  const show = useDialog();
  const lifts = useRows(
    useMemo(() => routineExercisesQuery(next?.routine.id ?? ''), [next?.routine.id]),
    [next?.routine.id],
  );

  // "No routines yet" is a claim, not a placeholder, so it waits until the
  // question has actually been answered. Nothing is drawn in the meantime: the
  // window is a frame or two, and a skeleton that flashes for 16ms is noise.
  if (loading) return null;

  if (!next) {
    return (
      <Section first pad={15}>
        <Text style={text.lead}>No routines yet</Text>
        <Text style={text.prose}>
          Make one on the Session tab and it lands here, with a button to start it.
        </Text>
      </Section>
    );
  }

  const rows = lifts ?? [];
  const meta = lifts ? [`${rows.length} ${rows.length === 1 ? 'LIFT' : 'LIFTS'}`] : ['\u2014'];
  const sets = rows.reduce((n, lift) => n + lift.targetSets, 0);
  if (sets > 0) meta.push(`${sets} SETS`);

  return (
    <Section first pad={15}>
      <Text style={text.label}>{lastRunLabel(next.lastRunAt)}</Text>
      <Text style={text.lead}>{next.routine.name}</Text>
      <Text style={text.meta}>{meta.join(' · ')}</Text>

      {/* The first three, and only the first three: the card is a reminder of
          what is coming, not the routine screen. */}
      {rows.slice(0, 3).map((lift) => (
        <Text key={lift.id} style={text.body} numberOfLines={1}>
          {lift.name}
        </Text>
      ))}

      <Pressable
        onPress={() => {
          // `lifts` is null until the query answers; refusing on that is
          // telling the user their routine is empty because the app has not
          // looked yet.
          if (lifts === null) return;
          if (lifts.length === 0) {
            show({
              title: 'Add an exercise first',
              message: 'A routine needs at least one lift before it can start.',
            });
            return;
          }
          try {
            startSession({ routineId: next.routine.id });
            // Replace, not push: going "back" to the card that started a running
            // session is not a state this screen should be able to return to.
            router.replace('/live');
          } catch {
            show({
              title: 'A session is already running',
              message: 'Finish or discard it before starting another.',
            });
          }
        }}
        accessibilityRole="button"
        style={{
          minHeight: 50,
          borderRadius: radius.plate,
          borderCurve: 'continuous',
          backgroundColor: color.accent,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: fabShadow,
        }}
      >
        <Text style={text.action}>Start {next.routine.name}</Text>
      </Pressable>
    </Section>
  );
}

/**
 * A number gets a visual only when there is something real to draw (§0). The
 * volume has last week to compare against, so it takes a delta; the session
 * count has no weekly target stored anywhere, so it ships plain rather than
 * wearing a meter against an invented denominator.
 */
function WeekTiles({ week }: { week: ReturnType<typeof weekStrip> }) {
  const { thisWeek, lastWeek } = week;
  const change =
    lastWeek.volumeKg > 0
      ? Math.round(((thisWeek.volumeKg - lastWeek.volumeKg) / lastWeek.volumeKg) * 100)
      : null;

  const tiles: Tile[] = [
    { label: 'SESSIONS', value: String(thisWeek.sessions) },
    {
      label: 'VOLUME',
      value: thisWeek.volumeKg > 0 ? formatTonnage(thisWeek.volumeKg) : '—',
      below:
        change === null ? undefined : (
          <Delta value={`${change >= 0 ? '+' : ''}${change}%`} positive={change >= 0} />
        ),
    },
  ];

  return <StatTiles items={tiles} surface="raised" />;
}

/** §0 reserves the rail for anything chronological. Two, because the calendar
 *  and the week strip are the other two routes into history. */
function RecentRail() {
  const sessions = useRows(
    useMemo(() => recentSessionsQuery(2), []),
    [],
  );
  const rows = useMemo(() => sessions ?? [], [sessions]);
  const ids = useMemo(() => rows.map((s) => s.id), [rows]);

  const recorded = useRows(
    useMemo(() => sessionsWithRecordsQuery(ids), [ids]),
    [ids],
  );
  const recordedIds = useMemo(() => new Set((recorded ?? []).map((r) => r.sessionId)), [recorded]);

  const items: RailItem[] = rows.map((session) => ({
    tone: sessionDotTone(session.startedAt),
    body: (
      <SessionRow
        startedAt={session.startedAt}
        name={session.name}
        durationSec={session.durationSec}
        totalSets={session.totalSets}
        totalVolumeKg={session.totalVolumeKg}
        hasRecord={recordedIds.has(session.id)}
      />
    ),
    onPress: () => router.push(`/history/${session.id}`),
  }));

  return (
    <Section label="RECENT" plated={false}>
      {rows.length ? (
        <Rail items={items} air={22} />
      ) : sessions === null ? null : (
        <Text style={text.prose}>Nothing logged yet. Your first session lands here.</Text>
      )}
    </Section>
  );
}

/** Dev-build only: the gates from Phases 1, 2 and 6, which no shipped screen links to. */
function DevLinks() {
  return (
    <Section label="DEV" plated={false}>
      <RowPlates>
        {[
          ['/dev/kitchen-sink', 'Kitchen sink', 'every primitive, every state'],
          ['/dev/lab34-a1', 'Lab 34 A1', 'routines, from the primitives'],
          ['/dev/lab33', 'Lab 33', 'live workout inputs'],
          ['/dev/fonts', 'Type ramp', "phase 1's gate"],
          ['/dev/gestures', 'Gestures', "phase 6's gate"],
          ['/dev/db', 'Database', 'row counts per table'],
        ].map(([href, title, meta]) => (
          <Link key={href} href={href as never} asChild>
            <RowPlate onPress={() => {}}>
              <ListRow title={title as string} meta={meta as string} />
            </RowPlate>
          </Link>
        ))}
      </RowPlates>
    </Section>
  );
}
