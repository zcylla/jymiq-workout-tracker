import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, Text, useWindowDimensions, View } from 'react-native';

import {
  ActionBar,
  type DropdownAnchor,
  DropdownMenu,
  ExercisesSheet,
  ExerciseStill,
  Icon,
  KeypadSheet,
  ListRow,
  PlateSheet,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  SetsSheet,
  useActionBarHeight,
  useDialog,
  type WorkoutParameter,
} from '@/components';
import {
  addSet,
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
import { exerciseStillFor } from '@/data/exercise-image';
import { estimate1RM } from '@/lib/e1rm';
import { liveE1rm, loadDelta } from '@/lib/live-readout';
import { nextExercise, nextSet, prevExercise, prevSet } from '@/lib/live-nav';
import type { Swipe } from '@/lib/pager';
import { formatPrValue, type PrHit, PR_LABELS } from '@/lib/pr';
import { moved } from '@/lib/reorder';
import { moveSetGroup, removalSetIds, setTypeLabel, setTypeOrdinal } from '@/lib/set-groups';
import type { SetKind } from '@/lib/volume';
import { elapsedSec, formatClock, restRemainingSec } from '@/lib/time';
import { formatWeight } from '@/lib/units';
import { countLoggedSets, formatTonnage, totalVolume } from '@/lib/volume';
import { ExerciseLadder } from '@/components/exercise-ladder';
import { LiveDeck } from '@/components/live-deck';
import { LiveInstrument } from '@/components/live-instrument';
import { LivePager } from '@/components/live-pager';
import { NoteSheet } from '@/components/note-sheet';
import { SetCounter } from '@/components/set-counter';
import { SetTypeSheet } from '@/components/set-type-sheet';
import { pop } from '@/components/haptics';
import { color, size, space, text } from '@/theme';

/** The still beside the title; a short phone gives the ring the difference. */
const STILL = 92;
const STILL_SHORT = 52;
/** Below this the screen goes compact: smaller still, the set line folds into the kicker, the deck closes up. */
const SHORT_DP = 700;
/** The air between the deck's readout and the action bar (the board's bar gap). */
const DECK_GAP = 9;

const KEEP_AWAKE_TAG = 'live-session';

function minimise() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

function LiveHeader({
  name,
  elapsed,
  menuOpen,
  onMenu,
}: {
  name?: string;
  elapsed: number;
  menuOpen: boolean;
  onMenu: (anchor: DropdownAnchor) => void;
}) {
  const menuButtonRef = useRef<View>(null);
  return (
    <View style={{ paddingTop: 6, gap: 9 }}>
      <View style={{ minHeight: size.hit, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={minimise}
          accessibilityRole="button"
          accessibilityLabel="Minimise workout"
          style={{ minWidth: size.hit, minHeight: size.hit, justifyContent: 'center' }}
        >
          <Icon name="back" tone={color.mid} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={text.numSm}>{formatClock(elapsed)}</Text>
        </View>
        <Pressable
          ref={menuButtonRef}
          collapsable={false}
          accessibilityRole="button"
          accessibilityLabel="Workout actions"
          accessibilityState={{ expanded: menuOpen }}
          onPress={() =>
            menuButtonRef.current?.measureInWindow((x, y, width, height) =>
              onMenu({ x, y, width, height }),
            )
          }
          style={{
            width: size.hit,
            height: size.hit,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="dots" />
        </Pressable>
      </View>
      {name ? <Text style={text.h1}>{name}</Text> : null}
    </View>
  );
}

/** Rendered last in the screen so the panel paints over the title and still behind nothing. */
function LiveMenu({
  open,
  anchor,
  onClose,
  onDiscard,
  onFinish,
  onPlates,
}: {
  open: boolean;
  anchor: DropdownAnchor | null;
  onClose: () => void;
  onDiscard: () => void;
  onFinish?: () => void;
  onPlates?: () => void;
}) {
  return (
    <DropdownMenu
      open={open}
      onClose={onClose}
      anchor={anchor}
      items={[
        ...(onFinish ? [{ label: 'Finish', onPress: onFinish }] : []),
        ...(onPlates ? [{ label: 'Plate calculator', onPress: onPlates }] : []),
        { label: 'Discard', tone: 'destructive' as const, onPress: onDiscard },
      ]}
    />
  );
}

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
  const [sheet, setSheet] = useState<'sets' | 'exercises' | 'notes' | 'plates' | 'type' | null>(
    null,
  );
  const [typeRequest, setTypeRequest] = useState<{
    setId: string;
    addingDrop: boolean;
    returnToSets: boolean;
  } | null>(null);
  const [keypadParam, setKeypadParam] = useState<WorkoutParameter | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pulse, setPulse] = useState(0);
  const [menu, setMenu] = useState<{ open: boolean; anchor: DropdownAnchor | null }>({
    open: false,
    anchor: null,
  });
  const openMenu = (anchor: DropdownAnchor) => setMenu({ open: true, anchor });
  const closeMenu = () => setMenu((m) => ({ ...m, open: false }));
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

  const historyOrdinal = set ? setTypeOrdinal(sets, set.id) : 1;
  const previous = useLiveQuery(
    lastCompletedExerciseSetQuery(
      exercise?.exerciseId ?? '',
      sessionId,
      historyOrdinal,
      set?.kind ?? 'working',
    ),
    [exercise?.exerciseId, sessionId, historyOrdinal, set?.kind],
  ).data?.[0];

  // The clock is derived from the wall clock, never counted, so a suspended app
  // resumes correct rather than behind.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const keepAwake = focused && settings.keepScreenOn && session !== undefined;
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

  const discard = () => {
    if (!session) return;
    if (setsLoaded && logged === 0) {
      discardSession(session.id);
      router.replace('/');
      return;
    }
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
  };

  const pick = (params: { sessionId: string } | { replace: string }) => {
    setSheet(null);
    router.push({ pathname: '/pick-exercise', params });
  };

  useFocusEffect(
    useCallback(() => {
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
        minimise();
        return true;
      });
      return () => sub.remove();
    }, [keypadParam, sheet, editing]),
  );

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
        <LiveHeader
          name={session.name}
          elapsed={elapsedSec(session.startedAt, session.pausedMs, now)}
          menuOpen={menu.open}
          onMenu={openMenu}
        />
        <Section first plated={false}>
          <RowPlates>
            <RowPlate onPress={() => pick({ sessionId: session.id })}>
              <ListRow title="Add exercise" />
            </RowPlate>
          </RowPlates>
        </Section>
        <LiveMenu open={menu.open} anchor={menu.anchor} onClose={closeMenu} onDiscard={discard} />
      </Screen>
    );
  }

  if (!exercise || !set) {
    // Both queries are still in flight on the frame this screen takes over.
    return (
      <Screen>
        <LiveHeader
          name={session.name}
          elapsed={elapsedSec(session.startedAt, session.pausedMs, now)}
          menuOpen={menu.open}
          onMenu={openMenu}
        />
        <LiveMenu open={menu.open} anchor={menu.anchor} onClose={closeMenu} onDiscard={discard} />
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

  const ready = set.completedAt == null && set.weightKg != null && set.reps != null && set.reps > 0;

  const log = () => {
    if (!ready) return;
    const hits = completeSet(set.id);
    pop();
    setPulse((n) => n + 1);
    setEditing(null);
    announce(show, hits, 'Record');
  };

  const finish = () => {
    if (!setsLoaded) return;
    if (logged === 0) {
      discardSession(session.id);
      router.replace('/');
    } else {
      finishSession(session.id);
      router.replace(`/summary/${session.id}`);
    }
  };

  const openExercise = (focus?: 'stats') =>
    router.push({
      pathname: '/exercise/[id]',
      params: focus ? { id: exercise.exerciseId, focus } : { id: exercise.exerciseId },
    });

  const still = exerciseStillFor(exercise.exerciseId, exercise.name);
  const compact = windowHeight < SHORT_DP;
  const stillSize = compact ? STILL_SHORT : STILL;
  const chooseType = (setId: string, addingDrop = false, returnToSets = false) => {
    setEditing(null);
    setTypeRequest({ setId, addingDrop, returnToSets });
    setSheet('type');
  };
  const closeType = () => setSheet(typeRequest?.returnToSets ? 'sets' : null);
  const changeType = (kind: SetKind, parentId?: string) => {
    if (!typeRequest) return;
    try {
      if (typeRequest.addingDrop) {
        const id = addSet(exercise.id, kind, parentId);
        setSessionCursor(session.id, { setId: id });
        setSheet(null);
      } else {
        updateSet(typeRequest.setId, { kind }, parentId);
        closeType();
      }
    } catch (error) {
      show({
        title: 'Could not change set',
        message: error instanceof Error ? error.message : 'Try again.',
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Screen bottomInset={barHeight + DECK_GAP} scroll={false}>
        <LiveHeader
          elapsed={elapsedSec(session.startedAt, session.pausedMs, now)}
          menuOpen={menu.open}
          onMenu={openMenu}
        />

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
                <ExerciseStill
                  exerciseId={exercise.exerciseId}
                  name={exercise.name}
                  size={stillSize}
                />
              </Pressable>
            ) : null}
          </Pressable>

          <SetCounter
            index={setIndex + 1}
            total={sets.length}
            typeLabel={setTypeLabel(sets, set.id)}
            compact={compact}
            onSets={() => setSheet('sets')}
            onType={() => chooseType(set.id)}
          />

          <LiveInstrument
            key={set.id}
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
        rungs={exerciseRows.map((e) => ({
          id: e.id,
          name: e.name,
          done: e.setsDone === e.setsTotal,
        }))}
        currentId={exercise.id}
        dimmed={editing !== null}
        onPress={() => setSheet('exercises')}
        onSelect={(id) => {
          const targetSets = allSets.filter((s) => s.sessionExerciseId === id);
          const target = targetSets.find((s) => s.completedAt == null) ?? targetSets[0];
          setSessionCursor(session.id, { sessionExerciseId: id, setId: target?.id ?? null });
        }}
      />

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <ActionBar
          primary={
            set.completedAt == null ? `Log set ${setIndex + 1}` : `Set ${setIndex + 1} logged`
          }
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
        onAddDrop={() => chooseType(set.id, true, true)}
        onReorder={(from, to) => reorderSets(moveSetGroup(sets, from, to).map((s) => s.id))}
        onDelete={(id) => {
          const removed = removalSetIds(sets, id);
          const remove = () => {
            if (sets.length > removed.length) removeSet(id);
            else {
              setSheet(null);
              removeSessionExercise(exercise.id);
            }
          };
          if (removed.length > 1) {
            show({
              title: 'Remove working set and drops?',
              message: `Removes this set and its ${removed.length - 1} linked drop ${removed.length === 2 ? 'set' : 'sets'}.`,
              actions: [
                { label: 'Remove', tone: 'destructive', onPress: remove },
                { label: 'Keep', tone: 'cancel' },
              ],
            });
          } else remove();
        }}
      />
      <SetTypeSheet
        key={`${typeRequest?.setId}-${typeRequest?.addingDrop}-${sheet === 'type'}`}
        open={sheet === 'type'}
        onClose={closeType}
        sets={sets}
        setId={typeRequest?.setId ?? set.id}
        addingDrop={typeRequest?.addingDrop}
        unit={settings.weightUnit}
        onChoose={changeType}
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
      <LiveMenu
        open={menu.open}
        anchor={menu.anchor}
        onClose={closeMenu}
        onDiscard={discard}
        onFinish={finish}
        onPlates={() => setSheet('plates')}
      />
      <PlateSheet open={sheet === 'plates'} onClose={() => setSheet(null)} loadKg={load} />
    </View>
  );
}
