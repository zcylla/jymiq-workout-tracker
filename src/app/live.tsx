import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, Text, View } from 'react-native';

import {
  ActionBar,
  LoadRing,
  ParamSelector,
  Screen,
  ScreenHeader,
  Section,
  Tape,
  useActionBarHeight,
} from '@/components';
import type { WorkoutParameter } from '@/components';
import {
  abandonSession,
  clearRest,
  completeSet,
  finishSession,
  setSessionCursor,
  updateSet,
} from '@/data/mutations/sessions';
import {
  activeSessionQuery,
  lastCompletedExerciseSetQuery,
  sessionExercisesQuery,
  sessionSetsQuery,
} from '@/data/queries/sessions';
import { estimate1RM, percentOf1RM } from '@/lib/e1rm';
import { type PrHit, PR_LABELS } from '@/lib/pr';
import { LOAD_SCALE, REPS_SCALE, RPE_SCALE } from '@/lib/scale';
import { elapsedSec, formatClock, formatRest, restRemainingSec } from '@/lib/time';
import { formatWeight } from '@/lib/units';
import { color, hairline, size, space, text } from '@/theme';

const TAPE_GUTTER = 62;
const LADDER_EDGE = 10;

/** The scale, unit and column each parameter drives. Load never leaves the ring. */
const TAPES = {
  load: { scale: LOAD_SCALE, unit: 'KG' },
  reps: { scale: REPS_SCALE, unit: 'REPS' },
  rpe: { scale: RPE_SCALE, unit: 'RPE' },
} as const;

/** A record is named, never counted — "2 PRs" tells you nothing. */
function announce(hits: PrHit[], title: string) {
  if (hits.length === 0) return;
  Alert.alert(
    title,
    hits
      .map((h) => {
        const line = `${PR_LABELS[h.category]} ${Math.round(h.value * 100) / 100}`;
        return h.previous == null ? line : `${line}\nWAS ${Math.round(h.previous * 100) / 100}`;
      })
      .join('\n\n'),
  );
}

export default function LiveScreen() {
  const [editing, setEditing] = useState<WorkoutParameter | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const barHeight = useActionBarHeight();

  // `useLiveQuery`'s second argument is a dependency list and it defaults to
  // `[]`, so a query built from a value that arrives later subscribes once with
  // the value it had on mount and never re-runs. Every session-scoped query
  // here starts life with an empty id, so omitting the deps renders an empty
  // session forever — and it fails as plausible data, not as an error.
  const session = useLiveQuery(activeSessionQuery()).data?.[0];
  const sessionId = session?.id ?? '';
  const exercises = useLiveQuery(sessionExercisesQuery(sessionId), [sessionId]).data ?? [];
  const allSets = useLiveQuery(sessionSetsQuery(sessionId), [sessionId]).data ?? [];

  const exercise =
    exercises.find((e) => e.id === session?.currentSessionExerciseId) ?? exercises[0];
  const sets = allSets.filter((s) => s.sessionExerciseId === exercise?.id);
  const set =
    sets.find((s) => s.id === session?.currentSetId) ??
    sets.find((s) => s.completedAt == null) ??
    sets[0];

  const previous = useLiveQuery(
    lastCompletedExerciseSetQuery(exercise?.exerciseId ?? '', sessionId),
    [exercise?.exerciseId, sessionId],
  ).data?.[0];

  // The clock is derived from the wall clock, never counted, so a suspended app
  // resumes correct rather than behind.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const discard = () => {
    if (!session) return false;
    Alert.alert('Discard this session?', 'Sets you already logged are kept.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          abandonSession(session.id);
          router.back();
        },
      },
    ]);
    return true;
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!session) return false;
      // Back never leaves a live session silently — the confirm is the whole
      // reason the handler exists, and it must claim the event to show one.
      discard();
      return true;
    });
    return () => sub.remove();
  });

  if (!session) {
    return (
      <Screen>
        <ScreenHeader title="No session" kicker="LIVE" onBack={() => router.back()} />
        <Section first label="NOTHING RUNNING" plated={false}>
          <Text style={text.prose}>Start a routine and it takes over this screen.</Text>
        </Section>
      </Screen>
    );
  }

  if (!exercise || !set) {
    return (
      <Screen>
        <ScreenHeader title={session.name} kicker="LIVE" onBack={() => router.back()} />
        <Section first label="EMPTY SESSION" plated={false}>
          <Text style={text.prose}>This session has no exercises in it yet.</Text>
        </Section>
      </Screen>
    );
  }

  const load = set.weightKg ?? 0;
  const reps = set.reps ?? 0;
  const oneRm = estimate1RM(load, reps);
  const restLeft = restRemainingSec(session.restUntil, now);
  const exerciseIndex = exercises.findIndex((e) => e.id === exercise.id);
  const setIndex = sets.findIndex((s) => s.id === set.id);
  const params: WorkoutParameter[] = exercise.trackRpe ? ['load', 'reps', 'rpe'] : ['load', 'reps'];

  // The ring is the load gauge in every state and never re-scales — what you
  // are editing is said by the selector, not by the middle of the dial.
  const core = {
    label: 'LOAD',
    value: formatWeight(load),
    subline: oneRm ? `KG · ${percentOf1RM(load, oneRm)}% OF 1RM` : 'KG',
    editing: editing !== null,
    chips: editing
      ? undefined
      : [
          { value: String(reps), unit: 'REPS' },
          ...(exercise.trackRpe
            ? [{ value: set.rpe == null ? '—' : String(set.rpe), unit: 'RPE' }]
            : []),
        ],
  };

  const onDetent = (value: number) => {
    if (editing === 'load') updateSet(set.id, { weightKg: value });
    else if (editing === 'reps') updateSet(set.id, { reps: value });
    else if (editing === 'rpe') updateSet(set.id, { rpe: value });
  };

  const log = () => {
    const hits = completeSet(set.id);
    setEditing(null);
    announce(hits, 'Logged');
  };

  const finish = () =>
    Alert.alert('Finish this session?', undefined, [
      { text: 'Not yet', style: 'cancel' },
      {
        text: 'Finish',
        onPress: () => {
          announce(finishSession(session.id), 'Finished');
          router.back();
        },
      },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Screen bottomInset={barHeight}>
        <ScreenHeader
          title={exercise.name}
          kicker={`EXERCISE ${exerciseIndex + 1} OF ${exercises.length}`}
          onBack={discard}
        />

        {/* Written, between two hairlines. A set strip was proposed and rejected. */}
        <View style={{ marginTop: space.within }}>
          <View style={{ height: 1, backgroundColor: hairline.onGround }} />
          <Text style={[text.label, { paddingVertical: 9, textAlign: 'center' }]}>
            SET {setIndex + 1} OF {sets.length}
          </Text>
          <View style={{ height: 1, backgroundColor: hairline.onGround }} />
        </View>

        <View style={{ paddingTop: space.between, gap: 8 }}>
          <View style={{ paddingRight: editing ? TAPE_GUTTER : 0, alignItems: 'center' }}>
            <Pressable
              onPress={() => setEditing('load')}
              disabled={editing !== null}
              accessibilityRole="button"
              accessibilityLabel="Edit load"
            >
              <LoadRing
                size={editing ? size.ringEdit : size.ringRest}
                scale={LOAD_SCALE}
                value={load}
                mark={oneRm}
                // The numerals mean the perimeter is live, which is only true of load.
                showNumerals={editing === 'load'}
                core={core}
              />
            </Pressable>
            {editing ? (
              <View style={{ position: 'absolute', right: 0, top: -6 }}>
                <Tape
                  scale={TAPES[editing].scale}
                  value={editing === 'load' ? load : editing === 'reps' ? reps : (set.rpe ?? 5)}
                  unit={TAPES[editing].unit}
                  onDetent={onDetent}
                />
              </View>
            ) : null}
          </View>

          {editing ? (
            <ParamSelector
              active={editing}
              parameters={params}
              values={{
                load: formatWeight(load),
                reps: String(reps),
                rpe: set.rpe == null ? '—' : String(set.rpe),
              }}
              gloss={editing === 'rpe' && set.rpe != null ? `RIR ${10 - set.rpe}` : undefined}
              onSelect={(p) => setEditing((current) => (current === p ? null : p))}
            />
          ) : null}
        </View>

        {previous ? (
          <Section label="LAST TIME" plated={false}>
            <Text style={text.body}>
              {formatWeight(previous.weightKg ?? 0)} kg × {previous.reps ?? 0}
              {previous.rpe == null ? '' : ` @ RPE ${previous.rpe}`}
            </Text>
          </Section>
        ) : null}

        <Section label="SESSION" plated={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.within }}>
            <Text style={text.num}>
              {formatClock(elapsedSec(session.startedAt, session.pausedMs, now))}
            </Text>
            <View style={{ flex: 1 }} />
            {restLeft > 0 ? (
              <Pressable onPress={() => clearRest(session.id)} hitSlop={12}>
                <Text style={[text.num, { color: color.accent }]}>REST {formatRest(restLeft)}</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={finish}
            hitSlop={8}
            style={{ minHeight: size.hit, justifyContent: 'center' }}
          >
            <Text style={text.body}>Finish session</Text>
          </Pressable>
        </Section>
      </Screen>

      {/* K3: the ladder sits in the system's back-gesture dead band, which is
          safe only because it is tap-only — a tap there is always delivered,
          a horizontal drag never would be. */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: LADDER_EDGE,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
          gap: 11,
          opacity: editing ? 0.28 : 1,
        }}
      >
        {exercises.map((e, i) => {
          const done = allSets
            .filter((s) => s.sessionExerciseId === e.id)
            .every((s) => s.completedAt != null);
          const current = e.id === exercise.id;
          return (
            <Pressable
              key={e.id}
              hitSlop={{ left: 10, right: 14, top: 4, bottom: 4 }}
              onPress={() => {
                setSessionCursor(session.id, { sessionExerciseId: e.id, setId: null });
                setEditing(null);
              }}
            >
              <Text
                style={[
                  text.meta,
                  { color: current ? color.accent : done ? color.done : color.dim },
                ]}
              >
                {i + 1}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ActionBar primary="Log set" onPrimary={log} />
    </View>
  );
}
