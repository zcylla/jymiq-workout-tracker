import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Pill, Screen, ScreenHeader, Section } from '@/components';
import {
  sessionLogExercisesQuery,
  sessionQuery,
  sessionRecordsQuery,
  sessionSetsQuery,
} from '@/data/queries/sessions';
import { formatPrValue } from '@/lib/pr';
import { formatSessionDuration, sessionDateLabel } from '@/lib/time';
import { formatWeight } from '@/lib/units';
import { wasPerformed } from '@/lib/volume';
import { color, size, text } from '@/theme';

const DASH = '—';

/** Lab 36 C3 value columns, right-anchored as a group behind a flex spacer. */
const COL = { kg: 54, rep: 34, rpe: 34, e1rm: 46 } as const;

type SetRow = Awaited<ReturnType<typeof sessionSetsQuery>>[number];
type ExerciseRow = Awaited<ReturnType<typeof sessionLogExercisesQuery>>[number];

/** Lab 36 C3. Read-only: no plate, no rail, the columns are the structure. */
export default function HistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: sessionRows } = useLiveQuery(
    useMemo(() => sessionQuery(id), [id]),
    [id],
  );
  const session = sessionRows?.[0];

  const { data: exerciseRows, updatedAt: exercisesUpdatedAt } = useLiveQuery(
    useMemo(() => sessionLogExercisesQuery(id), [id]),
    [id],
  );
  const exercises = exerciseRows ?? [];

  const { data: setRows, updatedAt: setsUpdatedAt } = useLiveQuery(
    useMemo(() => sessionSetsQuery(id), [id]),
    [id],
  );
  const allSets = setRows ?? [];

  const { data: recordRows } = useLiveQuery(
    useMemo(() => sessionRecordsQuery(id), [id]),
    [id],
  );
  const prExerciseIds = useMemo(
    () => new Set((recordRows ?? []).map((r) => r.exerciseId)),
    [recordRows],
  );

  const performedByExercise = useMemo(() => {
    const map = new Map<string, SetRow[]>();
    for (const s of allSets) {
      if (!wasPerformed(s)) continue;
      const list = map.get(s.sessionExerciseId) ?? [];
      list.push(s);
      map.set(s.sessionExerciseId, list);
    }
    return map;
  }, [allSets]);

  const loading = exercisesUpdatedAt === undefined || setsUpdatedAt === undefined;
  const anyPerformed = allSets.some(wasPerformed);
  // Once for the screen, not per exercise: the columns are right-anchored as a
  // group, so dropping one on a single exercise pushes its KG and REP out of
  // line with the exercise above it.
  const showRpe = allSets.some((s) => wasPerformed(s) && s.rpe != null);

  const durationLabel = session ? formatSessionDuration(session.durationSec) : DASH;
  const kickerParts = session ? [session.name.toUpperCase()] : [];
  if (durationLabel !== DASH) kickerParts.push(durationLabel);

  return (
    <Screen>
      <ScreenHeader
        title={session ? sessionDateLabel(session.startedAt) : ''}
        kicker={kickerParts.length ? kickerParts.join(' · ') : undefined}
        onBack={() => router.back()}
      />

      {!anyPerformed && !loading ? (
        <Section first plated={false}>
          <Text style={text.prose}>No sets logged in this session.</Text>
        </Section>
      ) : (
        exercises.map((ex, i) => (
          <ExerciseSection
            key={ex.id}
            exercise={ex}
            sets={performedByExercise.get(ex.id) ?? []}
            first={i === 0}
            hasRecord={prExerciseIds.has(ex.exerciseId)}
            showRpe={showRpe}
          />
        ))
      )}
    </Screen>
  );
}

function ExerciseSection({
  exercise,
  sets,
  first,
  hasRecord,
  showRpe,
}: {
  exercise: ExerciseRow;
  sets: SetRow[];
  first: boolean;
  hasRecord: boolean;
  showRpe: boolean;
}) {
  const right = hasRecord ? <Pill label="PR" /> : undefined;

  if (sets.length === 0) {
    return (
      <Section label={exercise.name.toUpperCase()} plated={false} first={first} right={right}>
        <Text style={text.prose}>No sets logged.</Text>
      </Section>
    );
  }

  return (
    <Section label={exercise.name.toUpperCase()} plated={false} first={first} right={right}>
      {/* One child, so Section's 11pt inter-child gap cannot creep between the
          rows — the board stacks them flush at 34pt, which is the whole reason
          a read-only row is 34 and not 44. */}
      <View>
        <SetTableHeader showRpe={showRpe} />
        {sets.map((s, i) => (
          <SetTableRow key={s.id} index={i + 1} set={s} showRpe={showRpe} />
        ))}
      </View>
    </Section>
  );
}

function SetTableHeader({ showRpe }: { showRpe: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
      <Text style={[text.label, { width: 26 }]}>SET</Text>
      <View style={{ flex: 1 }} />
      <Text style={[text.label, { width: COL.kg, textAlign: 'right' }]}>KG</Text>
      <Text style={[text.label, { width: COL.rep, textAlign: 'right' }]}>REP</Text>
      {showRpe ? (
        <Text style={[text.label, { width: COL.rpe, textAlign: 'right' }]}>RPE</Text>
      ) : null}
      <Text style={[text.label, { width: COL.e1rm, textAlign: 'right' }]}>e1RM</Text>
    </View>
  );
}

function SetTableRow({ index, set, showRpe }: { index: number; set: SetRow; showRpe: boolean }) {
  // A warm-up dims its index so it never reads as a top set at a glance.
  const indexColor = set.kind === 'warmup' ? color.dim : color.done;
  const kg = set.weightKg != null ? formatWeight(set.weightKg) : DASH;
  const rep = set.reps != null ? `×${set.reps}` : DASH;
  const rpe = set.rpe != null ? String(set.rpe) : DASH;
  const e1rm = set.e1rmKg != null ? formatPrValue('best_e1rm', set.e1rmKg) : DASH;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: size.readRow, gap: 10 }}>
      <Text style={[text.meta, { width: 26, color: indexColor }]}>
        {String(index).padStart(2, '0')}
      </Text>
      <View style={{ flex: 1 }} />
      <Text style={[text.numSm, { width: COL.kg, textAlign: 'right', color: color.hi }]}>{kg}</Text>
      <Text style={[text.numSm, { width: COL.rep, textAlign: 'right', color: color.mid }]}>
        {rep}
      </Text>
      {showRpe ? (
        <Text style={[text.numSm, { width: COL.rpe, textAlign: 'right', color: color.mid }]}>
          {rpe}
        </Text>
      ) : null}
      <Text style={[text.numSm, { width: COL.e1rm, textAlign: 'right', color: color.accent }]}>
        {e1rm}
      </Text>
    </View>
  );
}
