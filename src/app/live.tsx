import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';

import {
  ActionBar,
  ExercisesSheet,
  Icon,
  KeypadSheet,
  Screen,
  ScreenHeader,
  Section,
  SetsSheet,
  useActionBarHeight,
  useDialog,
} from '@/components';
import type { WorkoutParameter } from '@/components';
import {
  discardSession,
  clearRest,
  completeSet,
  extendRest,
  finishSession,
  setSessionCursor,
  updateSet,
} from '@/data/mutations/sessions';
import { useRows } from '@/data/live';
import { useSettings } from '@/data/settings';
import {
  activeSessionQuery,
  lastCompletedExerciseSetQuery,
  sessionExercisesQuery,
  sessionSetsQuery,
} from '@/data/queries/sessions';
import { estimate1RM } from '@/lib/e1rm';
import { nextExercise, nextSet, prevExercise, prevSet } from '@/lib/live-nav';
import type { Swipe } from '@/lib/pager';
import { formatPrValue, type PrHit, PR_LABELS } from '@/lib/pr';
import { elapsedSec, restRemainingSec } from '@/lib/time';
import { formatWeight } from '@/lib/units';
import { countLoggedSets } from '@/lib/volume';
import { ExerciseLadder } from '@/components/exercise-ladder';
import { LiveFooter } from '@/components/live-footer';
import { LiveInstrument } from '@/components/live-instrument';
import { LivePager } from '@/components/live-pager';
import { pop } from '@/components/haptics';
import { color, hairline, size, space, text } from '@/theme';

/** A record is named, never counted — "2 PRs" tells you nothing. */
function announce(show: ReturnType<typeof useDialog>, hits: PrHit[], title: string) {
  if (hits.length === 0) return;
  show({
    title,
    message: hits
      .map((h) => {
        const line = `${PR_LABELS[h.category]} ${formatPrValue(h.category, h.value)}`;
        return h.previous == null ? line : `${line}\nWAS ${formatPrValue(h.category, h.previous)}`;
      })
      .join('\n\n'),
  });
}

/**
 * **The live screen is kilograms, whatever Settings says, and that is the rule
 * rather than an omission.** This screen is the instrument: the tape's scale is
 * §0's, 20–140 by 2.5, and those steps are the plates that go on the bar. A
 * pounds scale would need increments §0 has not decided, and converting only
 * the readout would put 220.5 above a tape reading 100 — two units for one
 * number, on the one screen where the number matters most.
 *
 * Everything that *reports* a weight — history, summaries, records, routine
 * targets — follows the setting. You dial the kilograms you load; you read your
 * training back in your own unit.
 */
export default function LiveScreen() {
  const [editing, setEditing] = useState<WorkoutParameter | null>(null);
  const [sheet, setSheet] = useState<'sets' | 'exercises' | null>(null);
  const [keypadParam, setKeypadParam] = useState<WorkoutParameter | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pulse, setPulse] = useState(0);
  const barHeight = useActionBarHeight();
  const show = useDialog();
  const settings = useSettings();

  // `useLiveQuery`'s second argument is a dependency list and it defaults to
  // `[]`, so a query built from a value that arrives later subscribes once with
  // the value it had on mount and never re-runs. Every session-scoped query
  // here starts life with an empty id, so omitting the deps renders an empty
  // session forever — and it fails as plausible data, not as an error.
  const session = useLiveQuery(activeSessionQuery()).data?.[0];
  const sessionId = session?.id ?? '';
  const sessionExerciseRows = useRows(sessionExercisesQuery(sessionId), [sessionId]);
  const sessionSets = useRows(sessionSetsQuery(sessionId), [sessionId]);
  const exercises = sessionExerciseRows ?? [];
  const allSets = sessionSets ?? [];
  const setsLoaded = sessionSets !== null;

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

  const logged = countLoggedSets(allSets);
  /** Null until the sets are in — the dialog must not print a count of "0" it
   *  only believes because the query has not answered yet. */
  const tally = setsLoaded ? `${logged} ${logged === 1 ? 'set' : 'sets'}` : 'Your sets';

  /**
   * Leaving the session, from the back chevron and from Finish alike.
   *
   * **Nothing logged means nothing to decide.** Every planned set exists as a
   * row from the moment the session starts, so a session you opened by mistake
   * looks identical to one you are three sets into until you read `completedAt`.
   * With none of them logged there is nothing to keep, nothing to summarise and
   * nothing to ask about, so it is deleted outright — otherwise a mis-tap leaves
   * a permanent trained day on the calendar that only a database restore can
   * remove.
   *
   * **One logged set and it becomes the user's call**, because now both answers
   * are defensible: it happened and belongs in history, or it was a false start
   * you would rather not see again. The dialog names the count, since discarding
   * here really does delete those sets and the records they set.
   *
   * Leaving goes to Today rather than `back()`: every route into the live screen
   * uses `replace`, so there is no entry behind it and `back()` strands you on
   * the empty state with a "GO_BACK was not handled" warning.
   *
   * **The zero branch waits for the sets to load.** `useLiveQuery` hands back an
   * empty array while the query is still in flight, which is indistinguishable
   * from a session nobody has logged a set in — and taking the delete branch on
   * that would destroy a real session's worth of work on an early tap. Until
   * `updatedAt` arrives, leaving is treated as the decision it might be.
   */
  const leave = (intent: 'discard' | 'finish') => {
    if (!session) return false;

    if (setsLoaded && logged === 0) {
      discardSession(session.id);
      router.replace('/');
      return true;
    }

    if (intent === 'discard') {
      show({
        title: 'Discard session?',
        message: `Deletes ${tally.toLowerCase()} and any records.`,
        actions: [
          {
            label: 'Discard',
            tone: 'destructive',
            onPress: () => {
              discardSession(session.id);
              router.replace('/');
            },
          },
          { label: 'Keep', tone: 'cancel' },
        ],
      });
      return true;
    }

    finishSession(session.id);
    router.replace(`/summary/${session.id}`);
    return true;
  };

  const discard = () => leave('discard');

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (keypadParam !== null) {
        setKeypadParam(null);
        return true;
      }
      if (sheet !== null) {
        setSheet(null);
        return true;
      }
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
        <ScreenHeader title="" onBack={() => router.replace('/')} />
      </Screen>
    );
  }

  if (!exercise || !set) {
    // "No exercises in it" is a claim about the session, and both queries are
    // still in flight on the frame this screen takes over. Say nothing until
    // they have answered, rather than accusing a full session of being empty.
    return (
      <Screen>
        <ScreenHeader title={session.name} onBack={() => router.replace('/')} />
      </Screen>
    );
  }

  const load = set.weightKg ?? 0;
  const reps = set.reps ?? 0;
  const oneRm = estimate1RM(load, reps);
  const restLeft = restRemainingSec(session.restUntil, now);
  const exerciseIndex = exercises.findIndex((e) => e.id === exercise.id);
  const setIndex = sets.findIndex((s) => s.id === set.id);
  const showRpe = exercise.trackRpe || settings.trackRpe;
  const setsOf = exercises.map((e) => allSets.filter((s) => s.sessionExerciseId === e.id));
  const exerciseRows = exercises.map((e, i) => ({
    id: e.id,
    name: e.name,
    setsTotal: setsOf[i].length,
    setsDone: setsOf[i].filter((s) => s.completedAt != null).length,
  }));

  // The query already drops skipped exercises, so nothing here is `removed`.
  const nav = setsOf.map((exSets) => ({
    removed: false,
    sets: exSets.map((s) => ({ logged: s.completedAt != null })),
  }));
  const cursor = { exerciseIndex, setIndex };
  const pages: Record<Swipe, typeof cursor> = {
    nextSet: nextSet(nav, cursor),
    prevSet: prevSet(nav, cursor),
    nextExercise: nextExercise(nav, cursor),
    prevExercise: prevExercise(nav, cursor),
  };
  const can: Record<Swipe, boolean> = {
    nextSet: pages.nextSet !== cursor,
    prevSet: pages.prevSet !== cursor,
    nextExercise: pages.nextExercise !== cursor,
    prevExercise: pages.prevExercise !== cursor,
  };

  // Persisted, so the ring, ladder, sheets and Resume all read the same cursor.
  const turn = (swipe: Swipe) => {
    const to = pages[swipe];
    if (to === cursor) return;
    const target = exercises[to.exerciseIndex];
    setSessionCursor(session.id, {
      sessionExerciseId: target.id,
      setId: setsOf[to.exerciseIndex][to.setIndex]?.id ?? null,
    });
  };

  const onDetent = (value: number) => {
    if (editing === 'load') updateSet(set.id, { weightKg: value });
    else if (editing === 'reps') updateSet(set.id, { reps: value });
    else if (editing === 'rpe') updateSet(set.id, { rpe: value });
  };

  const ready = set.weightKg != null && set.reps != null;

  const log = () => {
    if (!ready) return;
    const hits = completeSet(set.id);
    pop();
    setPulse((n) => n + 1);
    setEditing(null);
    announce(show, hits, 'Record');
  };

  const finish = () => leave('finish');

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Screen bottomInset={barHeight} scroll={false}>
        {/* The back row stays put; everything under it is the page. */}
        <View style={{ paddingTop: 6, minHeight: size.hit, justifyContent: 'center' }}>
          <Pressable
            onPress={discard}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={{ alignSelf: 'flex-start' }}
          >
            <Icon name="back" tone={color.mid} />
          </Pressable>
        </View>

        <LivePager
          pageKey={`${exercise.id}:${set.id}`}
          can={can}
          disabled={editing !== null || sheet !== null || keypadParam !== null}
          onSwipe={turn}
        >
          <Pressable
            onPress={() => setSheet('exercises')}
            accessibilityRole="button"
            accessibilityLabel="Exercises"
          >
            <ScreenHeader
              title={exercise.name}
              kicker={`EXERCISE ${exerciseIndex + 1} OF ${exercises.length}`}
            />
          </Pressable>

          {/* Written, between two hairlines. A set strip was proposed and rejected. */}
          <Pressable
            onPress={() => setSheet('sets')}
            accessibilityRole="button"
            accessibilityLabel="Sets"
          >
            <View style={{ marginTop: space.within }}>
              <View style={{ height: 1, backgroundColor: hairline.onGround }} />
              <Text style={[text.label, { paddingVertical: 9, textAlign: 'center' }]}>
                SET {setIndex + 1} OF {sets.length}
              </Text>
              <View style={{ height: 1, backgroundColor: hairline.onGround }} />
            </View>
          </Pressable>

          <LiveInstrument
            editing={editing}
            load={load}
            reps={reps}
            rpe={set.rpe}
            oneRm={oneRm}
            showRpe={showRpe}
            onEdit={setEditing}
            pulse={pulse}
            onDetent={onDetent}
            // Lab 32's switch: one route or the other opens the keypad, and
            // the tape is always reachable by the one it is not on.
            onSelect={(p) =>
              settings.tapOpensKeypad
                ? setKeypadParam(p)
                : setEditing((current) => (current === p ? null : p))
            }
            onLongPress={(p) =>
              settings.tapOpensKeypad
                ? setEditing((current) => (current === p ? null : p))
                : setKeypadParam(p)
            }
          />

          {previous ? (
            <Section label="LAST TIME" plated={false}>
              <Text style={text.body}>
                {formatWeight(previous.weightKg ?? 0)} KG × {previous.reps ?? 0}
                {previous.rpe == null ? '' : ` @ RPE ${previous.rpe}`}
              </Text>
            </Section>
          ) : null}
        </LivePager>

        <LiveFooter
          elapsedSec={elapsedSec(session.startedAt, session.pausedMs, now)}
          restUntil={session.restUntil}
          restLeftSec={restLeft}
          onExtendRest={() => extendRest(session.id, 30)}
          onSkipRest={() => clearRest(session.id)}
          onFinish={finish}
        />
      </Screen>

      <ExerciseLadder
        rungs={exerciseRows.map((e) => ({ id: e.id, done: e.setsDone === e.setsTotal }))}
        currentId={exercise.id}
        dimmed={editing !== null}
        onPress={() => setSheet('exercises')}
      />

      <ActionBar primary="Log set" onPrimary={log} disabled={!ready} />

      <SetsSheet
        open={sheet === 'sets'}
        onClose={() => setSheet(null)}
        exerciseName={exercise.name}
        sessionId={session.id}
        sessionExerciseId={exercise.id}
        sets={sets}
        currentSetId={set.id}
      />
      <ExercisesSheet
        open={sheet === 'exercises'}
        onClose={() => setSheet(null)}
        sessionName={session.name}
        sessionId={session.id}
        exercises={exerciseRows}
        currentSessionExerciseId={exercise.id}
      />
      <KeypadSheet
        key={`${keypadParam}-${keypadParam !== null}`}
        open={keypadParam !== null}
        onClose={() => setKeypadParam(null)}
        parameter={keypadParam ?? 'load'}
        setId={set.id}
        currentValue={
          keypadParam === 'load' ? load : keypadParam === 'reps' ? reps : (set.rpe ?? null)
        }
      />
    </View>
  );
}
