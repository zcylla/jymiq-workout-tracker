import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  ActionBar,
  Chip,
  ColumnChart,
  Field,
  ListRow,
  Pill,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  StatTiles,
  type Tile,
  useActionBarHeight,
  useDialog,
} from '@/components';
import { useRows } from '@/data/live';
import {
  activateProgram,
  deleteProgram,
  pauseProgram,
  setProgramDay,
} from '@/data/mutations/programs';
import { startSession } from '@/data/mutations/sessions';
import { useSessionRunning } from '@/data/running';
import { programDaysQuery, programQuery } from '@/data/queries/programs';
import { routineListQuery } from '@/data/queries/routines';
import { sessionsInRangeQuery } from '@/data/queries/calendar';
import { dayKey, mondayIndex, trainedDays } from '@/lib/calendar';
import { type Schedule, programWeek, programWeekNumber, trainedDaysPerWeek } from '@/lib/program';
import { space } from '@/theme';

/**
 * Lab 34 A4. A sibling of `(tabs)`, so the push loses the tab bar and the
 * primary action takes that plane.
 *
 * **Three departures from the board, all recorded in the build log.** The two
 * tiles lose their denominators — no cycle length is stored, so WEEK has no
 * "/ 8" and §0 forbids a meter without one. The SESSIONS PER WEEK chart draws
 * elapsed weeks only, since no cycle length is stored to draw future ones, and
 * counts trained days against the scheduled days. And the weekday rows carry
 * no grip: seven weekdays do not reorder, so the grip would be a control that
 * does nothing. Tapping a row opens a routine picker inside the row's own
 * plate, the same idiom the custom-exercise form uses.
 */
export default function ProgramScreen() {
  const actionBar = useActionBarHeight();
  const show = useDialog();
  const { id } = useLocalSearchParams<{ id: string }>();

  const found = useRows(
    useMemo(() => programQuery(id), [id]),
    [id],
  );
  const days = useRows(
    useMemo(() => programDaysQuery(id), [id]),
    [id],
  );
  const routines = useRows(
    useMemo(() => routineListQuery(), []),
    [],
  );

  const range = useMemo(() => ({ from: startOfWeek(), to: startOfWeek() + 7 * 86_400_000 }), []);
  const sessions = useRows(
    useMemo(() => sessionsInRangeQuery(range.from, range.to), [range.from, range.to]),
    [range.from, range.to],
  );

  const historyTo = useMemo(() => nowExclusive(), []);
  const started = found?.[0]?.startedAt ?? null;
  const startedAt = started ?? 0;
  const history = useRows(
    useMemo(() => sessionsInRangeQuery(startedAt, historyTo), [startedAt, historyTo]),
    [startedAt, historyTo],
  );

  const running = useSessionRunning() === true;
  const [open, setOpen] = useState<number | null>(null);

  const program = found?.[0];
  const schedule: Schedule<{ id: string; name: string }> = useMemo(() => {
    const map = new Map<number, { id: string; name: string }>();
    for (const day of days ?? []) map.set(day.weekday, { id: day.routineId, name: day.name });
    return { days: map, since: program?.startedAt == null ? null : dayKey(program.startedAt) };
  }, [days, program]);

  const trained = useMemo(() => new Set(trainedDays(sessions ?? []).keys()), [sessions]);
  const week = useMemo(() => programWeek(schedule, trained), [schedule, trained]);

  const perWeek = useMemo(
    () =>
      started === null
        ? []
        : trainedDaysPerWeek(
            started,
            (history ?? []).map((row) => row.startedAt),
          ),
    [started, history],
  );

  if (!program) {
    return (
      <Screen>
        <ScreenHeader title="Program" onBack={() => router.back()} />
      </Screen>
    );
  }

  const active = program.status === 'active';
  const today = schedule.days.get(mondayIndex(new Date()));
  const scheduled = schedule.days.size;

  const shown = perWeek.slice(-8);
  const weekNo = perWeek.length;
  const firstWeek = weekNo - shown.length + 1;

  // Two tiles, not four (A4). Both ship plain: neither has a denominator that
  // is stored anywhere, and §0 is explicit that a meter needs a real one.
  const tiles: Tile[] = [
    { label: 'WEEK', value: active ? String(programWeekNumber(program.startedAt) ?? 1) : '—' },
    { label: 'DAYS', value: String(scheduled) },
  ];

  const start = () => {
    if (!today) return;
    if (!running) {
      try {
        startSession({ routineId: today.id });
      } catch {
        // A session started elsewhere between render and tap: resume it.
      }
    }
    router.replace('/live');
  };

  const confirmDelete = () =>
    show({
      title: `Delete ${program.name}?`,
      message: 'Routines stay.',
      actions: [
        {
          label: 'Delete',
          tone: 'destructive',
          onPress: () => {
            deleteProgram(program.id);
            router.back();
          },
        },
        { label: 'Cancel', tone: 'cancel' },
      ],
    });

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader
          title={program.name}
          onBack={() => router.back()}
          right={active ? <Pill label="RUNNING" /> : undefined}
        />

        <Section first pad={13}>
          <StatTiles items={tiles} surface="raised" />
        </Section>

        {active && program.startedAt != null && scheduled > 0 && weekNo >= 2 ? (
          <Section label="PER WEEK" plated={false}>
            <ColumnChart
              values={shown}
              xFirst={`WK ${firstWeek}`}
              xLast={`WK ${weekNo}`}
              value={`${shown[shown.length - 1]} of ${scheduled}`}
              h={54}
            />
          </Section>
        ) : null}

        <Section label="SCHEDULE" plated={false}>
          <RowPlates>
            {week.map((day) => (
              <RowPlate key={day.weekday}>
                <Field
                  label={day.label}
                  value={day.routine?.name ?? 'Rest'}
                  placeholder={day.routine === null}
                  onPress={() => setOpen(open === day.weekday ? null : day.weekday)}
                />
                {open === day.weekday ? (
                  <View style={{ paddingBottom: 11, gap: space.row - 1 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.row - 1 }}>
                      <Chip
                        label="REST"
                        on={day.routine === null}
                        onPress={() => {
                          setProgramDay(program.id, day.weekday, null);
                          setOpen(null);
                        }}
                      />
                      {(routines ?? []).map((r) => (
                        <Chip
                          key={r.id}
                          label={r.name.toUpperCase()}
                          on={day.routine?.id === r.id}
                          onPress={() => {
                            setProgramDay(program.id, day.weekday, r.id);
                            setOpen(null);
                          }}
                        />
                      ))}
                    </View>
                    {routines !== null && routines.length === 0 ? (
                      <View style={{ flexDirection: 'row' }}>
                        <Chip label="+ ROUTINE" onPress={() => router.push('/routine/new')} />
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </RowPlate>
            ))}
          </RowPlates>
        </Section>

        <Section plated={false}>
          <RowPlates>
            <RowPlate onPress={confirmDelete}>
              <ListRow danger title="Delete program" />
            </RowPlate>
          </RowPlates>
        </Section>
      </Screen>

      {/* Every state here acts on something. A "Start" with no routine on today
          would be the dead button this project has shipped twice. */}
      {active && today ? (
        <ActionBar
          primary={running ? 'Resume' : 'Start'}
          onPrimary={start}
          secondary="PAUSE"
          onSecondary={() => pauseProgram(program.id)}
        />
      ) : active ? (
        <ActionBar primary="Pause" onPrimary={() => pauseProgram(program.id)} />
      ) : (
        <ActionBar
          primary="Activate"
          disabled={scheduled === 0}
          onPrimary={() => activateProgram(program.id)}
        />
      )}
    </>
  );
}

/** Local midnight of this week's Monday — the range the day strip needs. */
function startOfWeek(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayIndex(now)).getTime();
}

/** The exclusive upper bound that includes a session started this millisecond. */
function nowExclusive(): number {
  return Date.now() + 1;
}
