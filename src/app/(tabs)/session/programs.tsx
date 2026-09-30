import { Link, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  Chevron,
  Icon,
  ListRow,
  Pill,
  ProgramWeek,
  Rail,
  type RailItem,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  useTabBarHeight,
} from '@/components';
import { useRows } from '@/data/live';
import { sessionsInRangeQuery } from '@/data/queries/calendar';
import { programListQuery } from '@/data/queries/programs';
import { useActiveSchedule } from '@/data/schedule';
import { trainedDays } from '@/lib/calendar';
import { NO_SCHEDULE, programWeek, programWeekNumber, upcomingScheduled } from '@/lib/program';
import { dueLabel } from '@/lib/next';
import { weekStrip } from '@/lib/week';
import { color, text } from '@/theme';

/**
 * Lab 34 A3. One program is running; the rest are not.
 *
 * Two departures from the board, both because the schema has no cycle:
 * §0 lists "by weekday or fixed cycle" and only the weekday half is stored, so
 * the meta line says BY WEEKDAY for every program and the board's "WEEK 3 / 8"
 * pill loses its denominator — a program has no length, so there is no
 * fraction and, by §0's visuals rule, no meter either.
 */
export default function ProgramsScreen() {
  const tabBar = useTabBarHeight();
  const active = useActiveSchedule();

  const programs = useRows(
    useMemo(() => programListQuery(), []),
    [],
  );

  // Only for its range and its clock — the strip's own arithmetic already knows
  // which three weeks are in view, and the current week is the last of them.
  const range = useMemo(() => weekStrip(new Map()), []);
  const sessions = useRows(
    useMemo(() => sessionsInRangeQuery(range.from, range.to), [range.from, range.to]),
    [range.from, range.to],
  );
  const trained = useMemo(() => new Set(trainedDays(sessions ?? []).keys()), [sessions]);

  const schedule = active?.schedule ?? NO_SCHEDULE;
  const program = active?.program ?? null;
  const week = useMemo(() => programWeek(schedule, trained), [schedule, trained]);
  const upcoming = useMemo(() => upcomingScheduled(schedule, 3), [schedule]);

  const idle = (programs ?? []).filter((p) => p.id !== program?.id);

  return (
    <Screen bottomInset={tabBar}>
      <ScreenHeader
        title="Programs"
        onBack={() => router.back()}
        right={
          <Link href="/program/new">
            <Icon name="plus" />
          </Link>
        }
      />

      {program ? (
        <Section label="ACTIVE" first pad={13}>
          {/* The plate is the target. Without this the running program has no
              route to its own detail at all — the NOT RUNNING rows navigate and
              the one you actually use would not, which is where pause and the
              schedule live. */}
          <Pressable
            onPress={() => router.push(`/program/${program.id}`)}
            accessibilityRole="button"
            style={({ pressed }) => [{ gap: 14 }, pressed && { opacity: 0.6 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={text.lead}>{program.name}</Text>
              <Pill label={`W${programWeekNumber(program.startedAt) ?? 1}`} />
              <View style={{ flex: 1 }} />
              <Chevron />
            </View>
            <ProgramWeek days={week} />
          </Pressable>
        </Section>
      ) : null}

      {upcoming.length ? (
        <Section label="NEXT UP" plated={false}>
          <Rail
            air={24}
            items={upcoming.map(
              (day, i): RailItem => ({
                tone: i === 0 ? 'accent' : i === 1 ? 'tick2' : 'tick1',
                body: (
                  <View style={{ gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                      <Text style={i === 0 ? text.num : [text.num, { color: color.mid }]}>
                        {dueLabel(day.daysAway, day.at)}
                      </Text>
                      <Text style={text.label}>{day.routine.name.toUpperCase()}</Text>
                    </View>
                  </View>
                ),
                onPress: () => router.push(`/routine/${day.routine.id}`),
              }),
            )}
          />
        </Section>
      ) : null}

      {/* Paused and never-run stay in one section rather than two (A3): the
          distinction is in the meta line, not in the structure. */}
      <Section label={program ? 'NOT RUNNING' : 'YOUR PROGRAMS'} first={!program} plated={false}>
        {programs === null ? null : (
          <>
            <RowPlates>
              {idle.map((p) => (
                <RowPlate key={p.id} onPress={() => router.push(`/program/${p.id}`)}>
                  <ListRow
                    title={p.name}
                    valueLabel={p.startedAt === null ? 'NEW' : 'PAUSED'}
                    dim={p.startedAt === null}
                  />
                </RowPlate>
              ))}
              <Link href="/program/new" asChild>
                <RowPlate onPress={() => {}}>
                  <ListRow title="New program" />
                </RowPlate>
              </Link>
            </RowPlates>
          </>
        )}
      </Section>
    </Screen>
  );
}
