import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, Text, useWindowDimensions, View } from 'react-native';

import {
  ActionBar,
  ExercisesSheet,
  ExerciseStill,
  Icon,
  KeypadSheet,
  ListRow,
  RowPlate,
  RowPlates,
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
  removeSessionExercise,
  removeSet,
  setSessionExerciseNote,
  reorderSessionExercises,
  reorderSets,
  setSessionCursor,
  skipSessionExercise,
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
import { exerciseStill } from '@/data/exercise-art';
import { estimate1RM } from '@/lib/e1rm';
import { liveE1rm, loadDelta } from '@/lib/live-readout';
import { nextExercise, nextSet, prevExercise, prevSet } from '@/lib/live-nav';
import type { Swipe } from '@/lib/pager';
import { formatPrValue, type PrHit, PR_LABELS } from '@/lib/pr';
import { moved } from '@/lib/reorder';
import { elapsedSec, formatClock, restRemainingSec } from '@/lib/time';
import { formatWeight } from '@/lib/units';
import { countLoggedSets, formatTonnage, totalVolume } from '@/lib/volume';
import { ExerciseLadder } from '@/components/exercise-ladder';
import { LiveDeck } from '@/components/live-deck';
import { LiveInstrument } from '@/components/live-instrument';
import { LivePager } from '@/components/live-pager';
import { NoteSheet } from '@/components/note-sheet';
import { pop } from '@/components/haptics';
import { color, hairline, size, space, text } from '@/theme';

/** The still beside the title; a short phone gives the ring the difference. */
const STILL = 92;
const STILL_SHORT = 52;
/** Below this the screen goes compact: smaller still, the set line folds into the kicker, the deck closes up. */
const SHORT_DP = 700;
/** The air between the deck's readout and the action bar (the board's bar gap). */
const DECK_GAP = 9;

const KEEP_AWAKE_TAG = 'live-session';

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

export default function LiveScreen() {
  const { data, updatedAt } = useLiveQuery(activeSessionQuery());
  const id = data?.[0]?.id;
  const focused = useIsFocused();
  useEffect(() => {
    if (focused && !id && updatedAt) router.replace('/');
  }, [focused, id, updatedAt]);
  if (!id) {
    return (
      <Screen>
        <ScreenHeader title="" onBack={() => router.replace('/')} />
      </Screen>
    );
  }
  // Keyed, so the session queries below are born with the real id: a live query
  // keeps its last rows when its deps change, and an id-less first answer of
  // `[]` would otherwise read as an empty session.
  return <LiveSession key={id} sessionId={id} />;
}

function LiveSession({ sessionId }: { sessionId: string }) {
  const [editing, setEditing] = useState<WorkoutParameter | null>(null);
  const [sheet, setSheet] = useState<'sets' | 'exercises' | 'notes' | null>(null);
  const [keypadParam, setKeypadParam] = useState<WorkoutParameter | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pulse, setPulse] = useState(0);
  const barHeight = useActionBarHeight();
  const show = useDialog();
  const settings = useSettings();
  const focused = useIsFocused();
  const { height: windowHeight } = useWindowDimensions();

  // `useLiveQuery`'s second argument is a dependency list and it defaults to
  // `[]`, so a query built from a value that arrives later subscribes once with
  // the value it had on mount and never re-runs. Every session-scoped query
  // here starts life with an empty id, so omitting the deps renders an empty
  // session forever — and it fails as plausible data, not as an error.
  const session = useLiveQuery(activeSessionQuery()).data?.[0];
  const sessionExerciseRows = useRows(sessionExercisesQuery(sessionId), [sessionId]);
  const sessionSets = useRows(sessionSetsQuery(sessionId), [sessionId]);
  const exercises = sessionExerciseRows ?? [];
  const allSets = sessionSets ?? [];
  const setsLoaded = sessionSets !== null;

  const exercisesLoaded = sessionExerciseRows !== null;

  // A cursor at nothing, or at an exercise that is gone, lands on the first one.
  const exercise =
    exercises.find((e) => e.id === session?.currentSessionExerciseId) ?? exercises[0];
  const sets = allSets.filter((s) => s.sessionExerciseId === exercise?.id);
  const set =
    sets.find((s) => s.id === session?.currentSetId) ??
    sets.find((s) => s.completedAt == null) ??
    sets[0];

  const previous = useLiveQuery(
    lastCompletedExerciseSetQuery(exercise?.exerciseId ?? '', sessionId, set?.position ?? 1),
    [exercise?.exerciseId, sessionId, set?.position],
  ).data?.[0];

  // The clock is derived from the wall clock, never counted, so a suspended app
  // resumes correct rather than behind.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const keepAwake = settings.keepScreenOn && session !== undefined;
  useEffect(() => {
    if (!keepAwake) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [keepAwake]);

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

  const pick = (params: { sessionId: string } | { replace: string }) => {
    setSheet(null);
    router.push({ pathname: '/pick-exercise', params });
  };

  // Only while focused: /live stays mounted under the exercise page and the
  // picker, and a handler left registered there would discard the session from
  // their back press.
  useEffect(() => {
    if (!focused) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (keypadParam !== null) {
        setKeypadParam(null);
        return true;
      }
      if (sheet !== null) {
        setSheet(null);
        return true;
      }
      if (editing !== null) {
        setEditing(null);
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

  if (exercisesLoaded && exercises.length === 0) {
    return (
      <Screen>
        <ScreenHeader title={session.name} onBack={discard} />
        <Section first plated={false}>
          <RowPlates>
            <RowPlate onPress={() => pick({ sessionId: session.id })}>
              <ListRow title="Add exercise" />
            </RowPlate>
          </RowPlates>
        </Section>
      </Screen>
    );
  }

  if (!exercise || !set) {
    // Both queries are still in flight on the frame this screen takes over.
    return (
      <Screen>
        <ScreenHeader title={session.name} onBack={() => router.replace('/')} />
      </Screen>
    );
  }

  const load = set.weightKg ?? 0;
  const reps = set.reps ?? 0;
  const oneRm = estimate1RM(load, reps);
  const e1rm = liveE1rm(sets, load, reps);
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
    exerciseId: e.exerciseId,
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

  const openExercise = (focus?: 'stats') =>
    router.push({
      pathname: '/exercise/[id]',
      params: focus ? { id: exercise.exerciseId, focus } : { id: exercise.exerciseId },
    });

  const still = exerciseStill(exercise.exerciseId);
  const compact = windowHeight < SHORT_DP;
  const stillSize = compact ? STILL_SHORT : STILL;

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Screen bottomInset={barHeight + DECK_GAP} scroll={false}>
        {/* The back row stays put, and carries the clock and Finish the deck has no room for. */}
        <View
          style={{
            paddingTop: 6,
            minHeight: size.hit,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              top: 6,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={text.numSm}>
              {formatClock(elapsedSec(session.startedAt, session.pausedMs, now))}
            </Text>
          </View>
          <Pressable
            onPress={discard}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Icon name="back" tone={color.mid} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={finish}
            hitSlop={{ left: 12, right: 12 }}
            accessibilityRole="button"
            style={({ pressed }) => ({
              minHeight: size.hit,
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={text.body}>Finish</Text>
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
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.within, paddingTop: 4 }}
          >
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={text.label}>
                EXERCISE {exerciseIndex + 1} OF {exercises.length}
                {compact ? ` · SET ${setIndex + 1} OF ${sets.length}` : ''}
              </Text>
              <Text style={text.h1} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
                {exercise.name}
              </Text>
            </View>
            {still ? (
              <Pressable
                onPress={() => openExercise()}
                accessibilityRole="button"
                accessibilityLabel="Exercise history"
              >
                <ExerciseStill exerciseId={exercise.exerciseId} size={stillSize} />
              </Pressable>
            ) : null}
          </Pressable>

          {/* Written, between two hairlines. A set strip was proposed and rejected. */}
          {compact ? null : (
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
          )}

          <LiveInstrument
            editing={editing}
            load={load}
            reps={reps}
            rpe={set.rpe}
            oneRm={oneRm}
            showRpe={showRpe}
            onEdit={(p) => setEditing((current) => (current === p ? null : p))}
            pulse={pulse}
            onDetent={onDetent}
            // Lab 32's switch: one route or the other opens the keypad, and
            // the tape is always reachable by the one it is not on.
            onSelect={(p) =>
              settings.tapOpensKeypad
                ? setKeypadParam(p)
                : setEditing((current) => (current === p ? null : p))
            }
            onType={setKeypadParam}
            onLongPress={(p) =>
              settings.tapOpensKeypad
                ? setEditing((current) => (current === p ? null : p))
                : setKeypadParam(p)
            }
          />
        </LivePager>

        <View style={{ paddingTop: space.within }}>
          <LiveDeck
            compact={compact}
            last={
              previous
                ? {
                    value: `${formatWeight(previous.weightKg ?? 0, settings.weightUnit)} × ${previous.reps ?? 0}${
                      previous.rpe == null ? '' : ` @ ${previous.rpe}`
                    }`,
                    delta:
                      set.weightKg != null && previous.weightKg != null
                        ? loadDelta(set.weightKg, previous.weightKg, settings.weightUnit)
                        : null,
                  }
                : null
            }
            hasNote={!!exercise.note}
            onHistory={() => openExercise()}
            onStats={() => openExercise('stats')}
            onNotes={() => setSheet('notes')}
            onSwap={() => pick({ replace: exercise.id })}
            volume={formatTonnage(
              totalVolume(allSets, { includeWarmup: true }),
              settings.weightUnit,
            )}
            sets={String(logged)}
            e1rm={
              e1rm == null
                ? '—'
                : settings.weightUnit === 'kg'
                  ? String(Math.round(e1rm))
                  : `${formatWeight(e1rm, settings.weightUnit)} LB`
            }
            restUntil={session.restUntil}
            restLeftSec={restLeft}
            onExtendRest={() => extendRest(session.id, 30)}
            onSkipRest={() => clearRest(session.id)}
          />
        </View>
      </Screen>

      <ExerciseLadder
        rungs={exerciseRows.map((e) => ({ id: e.id, done: e.setsDone === e.setsTotal }))}
        currentId={exercise.id}
        dimmed={editing !== null}
        onPress={() => setSheet('exercises')}
      />

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <ActionBar
          primary={`Log set ${setIndex + 1}`}
          onPrimary={log}
          disabled={!ready}
          secondary="SETS"
          onSecondary={() => setSheet('sets')}
        />
      </View>

      <NoteSheet
        open={sheet === 'notes'}
        onClose={() => setSheet(null)}
        exerciseName={exercise.name}
        note={exercise.note}
        onChange={(note) => setSessionExerciseNote(exercise.id, note)}
      />
      <SetsSheet
        open={sheet === 'sets'}
        onClose={() => setSheet(null)}
        exerciseName={exercise.name}
        sessionId={session.id}
        sessionExerciseId={exercise.id}
        sets={sets}
        currentSetId={set.id}
        onReorder={(from, to) => reorderSets(moved(sets, from, to).map((s) => s.id))}
        onDelete={(id) => {
          if (sets.length > 1) removeSet(id);
          else {
            setSheet(null);
            removeSessionExercise(exercise.id);
          }
        }}
      />
      <ExercisesSheet
        open={sheet === 'exercises'}
        onClose={() => setSheet(null)}
        sessionName={session.name}
        sessionId={session.id}
        exercises={exerciseRows}
        currentSessionExerciseId={exercise.id}
        onReorder={(from, to) =>
          reorderSessionExercises(moved(exerciseRows, from, to).map((e) => e.id))
        }
        onDelete={(id) => {
          const row = exerciseRows.find((e) => e.id === id);
          if (row && row.setsDone > 0) skipSessionExercise(id);
          else removeSessionExercise(id);
        }}
        onReplace={(id) => pick({ replace: id })}
        onAdd={() => pick({ sessionId: session.id })}
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
