import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import {
  ActionBar,
  Chip,
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
import { programDaysQuery, programQuery } from '@/data/queries/programs';
import { routineListQuery } from '@/data/queries/routines';
import { sessionsInRangeQuery } from '@/data/queries/calendar';
import { dayKey, mondayIndex, trainedDays } from '@/lib/calendar';
import { type Schedule, programWeek, programWeekNumber } from '@/lib/program';
import { space, text } from '@/theme';

/**
 * Lab 34 A4. A sibling of `(tabs)`, so the push loses the tab bar and the
 * primary action takes that plane.
 *
 * **Three departures from the board, all recorded in the build log.** The two
 * tiles lose their denominators — no cycle length is stored, so WEEK has no
 * "/ 8" and §0 forbids a meter without one. The SESSIONS PER WEEK chart is not
 * here: `kit.chart()` has no React counterpart yet, and §0's chart rules are
 * strict enough that inventing one for this screen would be the wrong place to
 * settle them. And the weekday rows carry no grip: seven weekdays do not
 * reorder, so the grip would be a control that does nothing. Tapping a row
 * opens a routine picker inside the row's own plate, the same idiom the
 * custom-exercise form uses.
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

  const [open, setOpen] = useState<number | null>(null);

  const program = found?.[0];
  const schedule: Schedule<{ id: string; name: string }> = useMemo(() => {
    const map = new Map<number, { id: string; name: string }>();
    for (const day of days ?? []) map.set(day.weekday, { id: day.routineId, name: day.name });
    return { days: map, since: program?.startedAt == null ? null : dayKey(program.startedAt) };
  }, [days, program]);

  const trained = useMemo(() => new Set(trainedDays(sessions ?? []).keys()), [sessions]);
  const week = useMemo(() => programWeek(schedule, trained), [schedule, trained]);

  if (!program) {
    return (
      <Screen>
        <ScreenHeader title="Program" kicker="PROGRAM" onBack={() => router.back()} />
      </Screen>
    );
  }

  const active = program.status === 'active';
  const today = schedule.days.get(mondayIndex(new Date()));
  const scheduled = schedule.days.size;

  // Two tiles, not four (A4). Both ship plain: neither has a denominator that
  // is stored anywhere, and §0 is explicit that a meter needs a real one.
  const tiles: Tile[] = [
    { label: 'WEEK', value: active ? String(programWeekNumber(program.startedAt) ?? 1) : '—' },
    { label: 'DAYS A WEEK', value: String(scheduled) },
  ];

  const start = () => {
    if (!today) return;
    try {
      startSession({ routineId: today.id });
      router.replace('/live');
    } catch {
      show({
        title: 'A session is already running',
        message: 'Finish or discard it before starting another.',
      });
    }
  };

  const confirmDelete = () =>
    show({
      title: `Delete ${program.name}?`,
      message: 'The routines on it stay. Only the weekday plan goes.',
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
          kicker="PROGRAM"
          onBack={() => router.back()}
          right={active ? <Pill label="RUNNING" /> : undefined}
        />

        <Section first pad={13}>
          <StatTiles items={tiles} surface="raised" />
        </Section>

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
                      <Text style={text.prose}>
                        No routines yet. Make one on the Session tab and it lands here.
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </RowPlate>
            ))}
          </RowPlates>
        </Section>

        <Section label="PROGRAM" plated={false}>
          <RowPlates>
            <RowPlate onPress={confirmDelete}>
              <ListRow title="Delete program" meta="THE ROUTINES ON IT STAY" valueLabel="DELETE" />
            </RowPlate>
          </RowPlates>
          <Text style={[text.prose, { marginTop: space.within }]}>
            {scheduled === 0
              ? 'Put a routine on at least one weekday, then activate it. Until a program is running, every untrained day is rest rather than missed.'
              : 'Only one program runs at a time. Activating this one pauses whichever was running.'}
          </Text>
        </Section>
      </Screen>

      {/* Every state here acts on something. A "Start" with no routine on today
          would be the dead button this project has shipped twice. */}
      {active && today ? (
        <ActionBar
          primary={`Start ${today.name}`}
          onPrimary={start}
          secondary="PAUSE"
          onSecondary={() => pauseProgram(program.id)}
        />
      ) : active ? (
        <ActionBar primary="Pause program" onPrimary={() => pauseProgram(program.id)} />
      ) : (
        <ActionBar
          primary="Activate program"
          onPrimary={() => {
            if (scheduled === 0) {
              show({
                title: 'Nothing is scheduled',
                message: 'Put a routine on at least one weekday first.',
              });
              return;
            }
            activateProgram(program.id);
          }}
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
