import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import {
  ActionBar,
  RowPlate,
  RowPlates,
  Scale,
  Screen,
  ScreenHeader,
  Section,
  useActionBarHeight,
  useDialog,
} from '@/components';
import { useRows } from '@/data/live';
import { saveCheckIn } from '@/data/mutations/readiness';
import { startSession } from '@/data/mutations/sessions';
import {
  latestCheckInQuery,
  recentPrimeSetsQuery,
  routinePrimeMusclesQuery,
} from '@/data/queries/readiness';
import { routineExercisesQuery } from '@/data/queries/routines';
import { useActiveSchedule } from '@/data/schedule';
import { nextScheduled } from '@/lib/program';
import {
  type Answers,
  dayStart,
  readinessCall,
  recentMuscles,
  type Energy,
  type Sleep,
  type Soreness,
} from '@/lib/readiness';
import { text } from '@/theme';

const SLEEP: { value: Sleep; label: string }[] = [
  { value: 'poor', label: 'POOR' },
  { value: 'ok', label: 'OK' },
  { value: 'good', label: 'GOOD' },
];
const SORENESS: { value: Soreness; label: string }[] = [
  { value: 'none', label: 'NONE' },
  { value: 'some', label: 'SOME' },
  { value: 'a_lot', label: 'A LOT' },
];
const ENERGY: { value: Energy; label: string }[] = [
  { value: 'low', label: 'LOW' },
  { value: 'ok', label: 'OK' },
  { value: 'good', label: 'GOOD' },
];

const RECENT_MS = 48 * 3_600_000;

/**
 * Lab 37 D3. Optional and never a gate on Start. Answers save as soon as all
 * three are set, and the call is a sentence: a guess is not drawn like a
 * measurement (§0).
 */
export default function CheckInScreen() {
  const actionBar = useActionBarHeight();
  const show = useDialog();
  const now = useMemo(() => nowMs(), []);

  const stored = useRows(
    useMemo(() => latestCheckInQuery(dayStart(now)), [now]),
    [now],
  );
  const row = stored?.[0] ?? null;

  const [edited, setEdited] = useState<Partial<Answers> | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const draft: Partial<Answers> =
    edited ?? (row ? { sleep: row.sleep, soreness: row.soreness, energy: row.energy } : {});
  const id = savedId ?? row?.id;

  const change = (patch: Partial<Answers>) => {
    const next = { ...draft, ...patch };
    setEdited(next);
    if (next.sleep && next.soreness && next.energy) {
      setSavedId(saveCheckIn(next as Answers, id));
    }
  };

  const active = useActiveSchedule();
  const next = useMemo(() => (active === null ? null : nextScheduled(active.schedule)), [active]);
  const routineId = next?.routine.id ?? '';

  const prime = useRows(
    useMemo(() => routinePrimeMusclesQuery(routineId), [routineId]),
    [routineId],
  );
  const recentRows = useRows(
    useMemo(() => recentPrimeSetsQuery(now - RECENT_MS), [now]),
    [now],
  );
  const lifts = useRows(
    useMemo(() => routineExercisesQuery(routineId), [routineId]),
    [routineId],
  );

  const answered = draft.sleep && draft.soreness && draft.energy;
  const call = useMemo(() => {
    if (!draft.sleep || !draft.soreness || !draft.energy) return null;
    return readinessCall({
      answers: { sleep: draft.sleep, soreness: draft.soreness, energy: draft.energy },
      routineName: next ? next.routine.name : null,
      recent: recentMuscles(
        recentRows ?? [],
        (prime ?? []).map((p) => p.muscle),
        now,
      ),
      now,
    });
  }, [draft.sleep, draft.soreness, draft.energy, next, recentRows, prime, now]);

  const start = () => {
    if (!next || lifts === null) return;
    if (lifts.length === 0) {
      show({
        title: 'Add an exercise first',
        message: 'A routine needs at least one lift before it can start.',
      });
      return;
    }
    try {
      startSession({ routineId: next.routine.id });
      router.replace('/live');
    } catch {
      show({
        title: 'A session is already running',
        message: 'Finish or discard it before starting another.',
      });
    }
  };

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader
          title="How are you today?"
          kicker="CHECK-IN · 3 TAPS"
          onBack={() => router.back()}
        />

        <Section first plated={false}>
          <RowPlates>
            <RowPlate>
              <Scale
                label="SLEEP"
                options={SLEEP}
                value={draft.sleep ?? null}
                onChange={(v) => change({ sleep: v as Sleep })}
              />
            </RowPlate>
            <RowPlate>
              <Scale
                label="SORENESS"
                options={SORENESS}
                value={draft.soreness ?? null}
                onChange={(v) => change({ soreness: v as Soreness })}
              />
            </RowPlate>
            <RowPlate>
              <Scale
                label="ENERGY"
                options={ENERGY}
                value={draft.energy ?? null}
                onChange={(v) => change({ energy: v as Energy })}
              />
            </RowPlate>
          </RowPlates>
        </Section>

        <Section label="WHAT THAT MEANS" plated={false}>
          {call && answered ? (
            <View style={{ gap: 8 }}>
              <Text style={text.lead}>{call.lead}</Text>
              <Text style={text.prose}>{call.reason}</Text>
            </View>
          ) : (
            <Text style={text.prose}>Answer all three and the call appears here.</Text>
          )}
        </Section>

        <Section label="THIS IS A GUESS, NOT A MEASUREMENT" plated={false}>
          <Text style={text.prose}>
            Three taps and which of today&apos;s muscles you trained in the last two days. No
            wearable, no HRV, no sleep tracking — so it is worth exactly what you put into it, and
            it is written as a sentence rather than a score for that reason.
          </Text>
        </Section>
      </Screen>

      {next ? (
        <ActionBar
          primary={`Start ${next.routine.name}`}
          onPrimary={start}
          secondary="SKIP"
          onSecondary={() => router.back()}
        />
      ) : (
        <ActionBar primary="Done" onPrimary={() => router.back()} />
      )}
    </>
  );
}

function nowMs(): number {
  return Date.now();
}
