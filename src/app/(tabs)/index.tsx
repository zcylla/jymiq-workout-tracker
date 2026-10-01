import { Link, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  Chevron,
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
  Meter,
  StatTiles,
  type Tile,
  WeekStrip,
  useTabBarHeight,
} from '@/components';
import { useRows } from '@/data/live';
import { sessionsInRangeQuery } from '@/data/queries/calendar';
import { exerciseCountQuery } from '@/data/queries/exercises';
import { loggedSessionIdsQuery } from '@/data/queries/load';
import { useSettings } from '@/data/settings';
import { routineExercisesQuery, routineListQuery } from '@/data/queries/routines';
import { recentSessionsQuery, sessionsWithRecordsQuery } from '@/data/queries/sessions';
import { lastRunPerRoutineQuery } from '@/data/queries/today';
import { useSessionRunning } from '@/data/running';
import { useActiveSchedule } from '@/data/schedule';
import { useStartSession } from '@/data/start';
import { trainedDays } from '@/lib/calendar';
import { nextKicker } from '@/lib/next';
import { type ScheduledDay, nextScheduled } from '@/lib/program';
import { dateLabel, sessionDotTone } from '@/lib/time';
import { formatTonnage } from '@/lib/volume';
import { type StripDay, sessionsMeter, weekStrip } from '@/lib/week';
import { color, fabShadow, hairline, motion, radius, size, space, text } from '@/theme';

/**
 * Today — Lab 45 W3. The next routine on a quiet raised card with a full-width
 * accent Start, the scrollable week strip whose fill is the graph, and the
 * recent-sessions rail.
 *
 * §0 gives it no records section: the rail's PR pill already says it and the
 * timeline lives on Strength.
 *
 * "Next" is the running program's schedule and nothing else. It used to be a
 * heuristic — the routine trained least recently — standing in for a schedule
 * nothing stored; programs store one, so the heuristic is gone rather than kept
 * as a fallback. With no program running there is no next, and the card is just MAKE A PROGRAM.
 */
const WEEK_PAD = 13;

export default function TodayScreen() {
  const tabBar = useTabBarHeight();

  // One call: the cells, the query range and the two weeks' totals all come out
  // of the same arithmetic, so they cannot disagree about which days are in view.
  // Empty first, only for its range and its clock.
  const strip = useMemo(() => weekStrip(new Map()), []);
  const active = useActiveSchedule();

  const rangeRows = useRows(
    useMemo(() => sessionsInRangeQuery(strip.from, strip.to), [strip.from, strip.to]),
    [strip.from, strip.to],
  );
  const week = useMemo(
    () => weekStrip(trainedDays(rangeRows ?? []), strip.todayAt, active?.schedule),
    [rangeRows, strip.todayAt, active?.schedule],
  );

  const lastRuns = useRows(
    useMemo(() => lastRunPerRoutineQuery(), []),
    [],
  );

  /**
   * `null` until the schedule has answered. Deciding "no program running" off a
   * query that has not loaded is what made the tab the app opens on flash its
   * empty state on every launch.
   */
  const next = useMemo(() => (active === null ? null : nextScheduled(active.schedule)), [active]);
  const lastRunAt = useMemo(() => {
    if (!next || lastRuns === null) return null;
    const row = lastRuns.find((r) => r.routineId === next.routine.id);
    return row?.lastRunAt ?? null;
  }, [next, lastRuns]);

  const routines = useRows(
    useMemo(() => routineListQuery(), []),
    [],
  );
  const logged = useRows(
    useMemo(() => loggedSessionIdsQuery(), []),
    [],
  );
  // Lab 43 T3: a fresh install has nothing to schedule, so "make a program" is
  // a route it cannot take yet. Both answers must be in before claiming it.
  const fresh = routines?.length === 0 && logged?.length === 0;

  return (
    <Screen bottomInset={tabBar}>
      {/* Settings is not a tab (§0) — it is this gear. */}
      <ScreenHeader
        title="Today"
        kicker={dateLabel(strip.todayAt).toUpperCase()}
        right={
          <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
            <Icon name="gear" />
          </Pressable>
        }
      />

      {fresh ? (
        <FirstSteps />
      ) : (
        <NextCard next={next} lastRunAt={lastRunAt} loading={active === null} />
      )}

      <Section label="THIS WEEK" pad={WEEK_PAD} tone="glass">
        <WeekStrip
          bleed={WEEK_PAD}
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
  lastRunAt,
  loading,
}: {
  next: ScheduledDay<{ id: string; name: string }> | null;
  lastRunAt: number | null;
  loading: boolean;
}) {
  const running = useSessionRunning();
  const start = useStartSession();
  const lifts = useRows(
    useMemo(() => routineExercisesQuery(next?.routine.id ?? ''), [next?.routine.id]),
    [next?.routine.id],
  );
  const [open, setOpen] = useState(false);
  const openSV = useSharedValue(0);
  const listHeightSV = useSharedValue(0);
  useEffect(() => {
    openSV.set(
      withTiming(open ? 1 : 0, { duration: motion.base, easing: Easing.out(Easing.cubic) }),
    );
  }, [open, openSV]);
  const listStyle = useAnimatedStyle(() => ({
    height: listHeightSV.get() * openSV.get(),
    opacity: openSV.get(),
    marginTop: (openSV.get() - 1) * space.within,
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${openSV.get() * 90}deg` }],
  }));

  // "Nothing is scheduled" is a claim, not a placeholder, so it waits until the
  // question has actually been answered. Nothing is drawn in the meantime: the
  // window is a frame or two, and a skeleton that flashes for 16ms is noise.
  if (loading) return null;

  if (!next) {
    return (
      <Section first hero pad={15}>
        <Pressable
          onPress={() => router.push('/session/programs')}
          accessibilityRole="button"
          style={{ minHeight: size.hit, justifyContent: 'center' }}
        >
          <Text style={[text.label, { color: color.accent }]}>MAKE A PROGRAM</Text>
        </Pressable>
      </Section>
    );
  }

  const rows = lifts ?? [];
  const meta = lifts ? [`${rows.length} ${rows.length === 1 ? 'LIFT' : 'LIFTS'}`] : ['\u2014'];
  const sets = rows.reduce((n, lift) => n + lift.targetSets, 0);
  if (sets > 0) meta.push(`${sets} SETS`);

  // `running` and `lifts` are null until they answer; acting on that is telling
  // the user their routine is empty, or that nothing runs, because the app has
  // not looked yet. An empty routine cannot start, so its button is dim.
  const resume = running === true;
  const disabled = running === null || lifts === null || (!resume && lifts.length === 0);

  const press = () => {
    if (!disabled) start();
  };

  return (
    <Section first hero pad={15}>
      <Pressable
        onPress={() => rows.length > 0 && setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${next.routine.name}, ${open ? 'hide' : 'show'} exercises`}
        style={{ gap: space.within }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[text.label, { flex: 1 }]}>
            {nextKicker(next.daysAway, next.at, lastRunAt)}
          </Text>
          {rows.length > 0 ? (
            <Animated.View style={chevronStyle}>
              <Chevron />
            </Animated.View>
          ) : null}
        </View>
        <Text style={text.lead}>{next.routine.name}</Text>
        <Text style={text.meta}>{meta.join(' · ')}</Text>

        <Animated.View style={[{ overflow: 'hidden' }, listStyle]} pointerEvents="none">
          <View
            onLayout={(e) => listHeightSV.set(e.nativeEvent.layout.height)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              borderWidth: 1,
              borderColor: hairline.onPlate,
              borderRadius: radius.row,
              borderCurve: 'continuous',
              paddingVertical: 11,
              paddingHorizontal: 13,
              gap: 7,
            }}
          >
            {rows.map((lift) => (
              <View key={lift.id} style={{ flexDirection: 'row', gap: 9 }}>
                <Text style={[text.body, { color: color.lo }]}>{'\u2022'}</Text>
                <Text style={[text.body, { flex: 1 }]} numberOfLines={1}>
                  {lift.name}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </Pressable>

      <Pressable
        onPress={press}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={{
          minHeight: 50,
          borderRadius: radius.plate,
          borderCurve: 'continuous',
          backgroundColor: resume ? color.done : color.accent,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: fabShadow,
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <Text style={text.action}>{resume ? 'Resume' : 'Start'}</Text>
      </Pressable>
    </Section>
  );
}

/** Lab 43 T3 — the empty state is a set of actions, not an apology. */
function FirstSteps() {
  const start = useStartSession();
  const running = useSessionRunning();
  const count = useRows(
    useMemo(() => exerciseCountQuery(), []),
    [],
  );
  const exercises = count?.[0]?.n;

  return (
    <Section first plated={false}>
      <RowPlates>
        <RowPlate onPress={() => router.push('/routine/new')}>
          <ListRow title="Build a routine" />
        </RowPlate>
        <RowPlate onPress={() => router.push('/session/library')}>
          <ListRow title="Browse the library" meta={exercises ? String(exercises) : undefined} />
        </RowPlate>
        <RowPlate onPress={start}>
          <ListRow title={running ? 'Resume' : 'Empty session'} />
        </RowPlate>
      </RowPlates>
    </Section>
  );
}

/**
 * A number gets a visual only when there is something real to draw (§0). The
 * volume has last week to compare against, so it takes a delta; the session
 * count takes a meter only against a real denominator: the running program's
 * planned days, else the weekly goal, and is a plain number otherwise. Two tiles, as the
 * board draws them — the volume can run past five characters.
 */
function WeekTiles({ week }: { week: ReturnType<typeof weekStrip> }) {
  const { weightUnit, weeklyGoal } = useSettings();
  const { thisWeek, lastWeek, plannedPerWeek } = week;
  const fill = sessionsMeter(thisWeek.sessions, plannedPerWeek, weeklyGoal);
  const change =
    lastWeek.volumeKg > 0
      ? Math.round(((thisWeek.volumeKg - lastWeek.volumeKg) / lastWeek.volumeKg) * 100)
      : null;

  const tiles: Tile[] = [
    {
      label: 'SESSIONS',
      value: String(thisWeek.sessions),
      tone: thisWeek.sessions ? 'hi' : 'lo',
      visual: fill === null ? undefined : <Meter value={fill} width={44} />,
    },
    {
      label: 'VOLUME',
      value: thisWeek.volumeKg > 0 ? formatTonnage(thisWeek.volumeKg, weightUnit) : '—',
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
  const { weightUnit } = useSettings();
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
        unit={weightUnit}
      />
    ),
    onPress: () => router.push(`/history/${session.id}`),
  }));

  if (!rows.length) return null;

  return (
    <Section label="RECENT" plated={false}>
      <Rail items={items} air={22} />
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
          ['/dev/chart', 'Column chart', 'Lab 34 A4 and Lab 39 Q1'],
          ['/dev/lab33', 'Lab 33', 'live workout inputs'],
          ['/dev/fonts', 'Type ramp', "phase 1's gate"],
          ['/dev/gestures', 'Gestures', "phase 6's gate"],
          ['/dev/glass', 'Glass lab', 'style, blur, background and scope'],
          ['/dev/control-tint', 'Control tint', 'six flatter controls beside current chrome'],
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
