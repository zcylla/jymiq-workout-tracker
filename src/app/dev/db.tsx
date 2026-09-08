import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListRow, RowPlate, RowPlates } from '@/components';
import { db } from '@/data/db';
import { addExerciseToRoutine, createRoutine } from '@/data/mutations/routines';
import {
  abandonSession,
  completeSet,
  finishSession,
  startSession,
} from '@/data/mutations/sessions';
import { activeSessionQuery, sessionSetsQuery } from '@/data/queries/sessions';
import { PR_LABELS } from '@/lib/pr';
import { formatTonnage } from '@/lib/volume';
import { exercises, personalRecords, routines, sessions, sets } from '@/data/schema';
import { color, containment, space, text } from '@/theme';

/**
 * Routine creation is Phase 6's screen, so until it exists this is what puts a
 * routine on the device to open. It uses the real mutations, which is also the
 * only exercise the transaction path gets before the live session writes.
 */
function makeDemoRoutine() {
  const picks = db.select({ id: exercises.id }).from(exercises).limit(4).all();
  const id = createRoutine({ name: 'Lower A', note: 'demo' });
  picks.forEach((ex, i) =>
    addExerciseToRoutine({
      routineId: id,
      exerciseId: ex.id,
      targetSets: 5 - i,
      targetReps: 8 + i * 2,
      targetWeightKg: 100 - i * 20,
      restSec: 180 - i * 30,
    }),
  );
  router.push(`/routine/${id}`);
}

/** Leaves a session open on the device so `/live` has something to render. */
function startLiveSession(): void {
  const [routine] = db.select({ id: routines.id }).from(routines).limit(1).all();
  if (!routine) {
    Alert.alert('No routine', 'Make a demo routine first.');
    return;
  }
  const [live] = activeSessionQuery().all();
  if (live) abandonSession(live.id);
  startSession({ routineId: routine.id });
  router.push('/live');
}

/**
 * The whole session path in one press: snapshot a routine, log every set it
 * planned, close it. The interesting part is what comes back — the records are
 * detected against real history, so pressing this twice should name fewer the
 * second time, and pressing it on a heavier routine should name more.
 */
function runDemoSession(): void {
  const [routine] = db.select({ id: routines.id }).from(routines).limit(1).all();
  if (!routine) {
    Alert.alert('No routine', 'Make a demo routine first.');
    return;
  }

  const [live] = activeSessionQuery().all();
  if (live) abandonSession(live.id);

  const sessionId = startSession({ routineId: routine.id });
  const planned = sessionSetsQuery(sessionId).all();
  const hits = planned.flatMap((s) => completeSet(s.id));
  const closing = finishSession(sessionId);

  const [done] = db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1).all();
  const named = [...hits, ...closing].map((h) => `${PR_LABELS[h.category]} ${h.value}`);

  Alert.alert(
    `${planned.length} sets logged`,
    [
      `${formatTonnage(done?.totalVolumeKg ?? 0)} · ${done?.totalSets ?? 0} working sets`,
      named.length ? named.join('\n') : 'No records.',
    ].join('\n\n'),
  );
}

/** Row counts, so "did the migration run" has an answer on the device. */
export default function DbScreen() {
  const insets = useSafeAreaInsets();
  const counts = [
    ['EXERCISES', useLiveQuery(db.select().from(exercises)).data?.length],
    ['ROUTINES', useLiveQuery(db.select().from(routines)).data?.length],
    ['SESSIONS', useLiveQuery(db.select().from(sessions)).data?.length],
    ['SETS', useLiveQuery(db.select().from(sets)).data?.length],
    ['RECORDS', useLiveQuery(db.select().from(personalRecords)).data?.length],
  ] as const;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.ground }}
      contentContainerStyle={{
        paddingHorizontal: space.pad,
        paddingTop: insets.top + 10,
        gap: space.within,
      }}
    >
      <Text style={text.label}>DATABASE</Text>
      <Text style={text.h1}>Tables</Text>
      <View style={{ gap: space.row, paddingTop: space.within }}>
        {counts.map(([name, n]) => (
          <View
            key={name}
            style={[
              containment.rowPlate,
              { paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row' },
            ]}
          >
            <Text style={text.rowName}>{name}</Text>
            <View style={{ flex: 1 }} />
            <Text style={text.num}>{n ?? '—'}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingTop: space.between }}>
        <RowPlates>
          <RowPlate onPress={makeDemoRoutine}>
            <ListRow title="Make a demo routine" meta="createRoutine + addExerciseToRoutine" />
          </RowPlate>
          <RowPlate onPress={startLiveSession}>
            <ListRow title="Start a live session" meta="leaves it in progress and opens /live" />
          </RowPlate>
          <RowPlate onPress={runDemoSession}>
            <ListRow
              title="Run a demo session"
              meta="start + log every set + finish, with records"
            />
          </RowPlate>
          <RowPlate onPress={() => router.push('/exercise/new')}>
            <ListRow title="New custom exercise" meta="lab 35 b3" />
          </RowPlate>
        </RowPlates>
      </View>
    </ScrollView>
  );
}
