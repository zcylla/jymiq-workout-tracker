import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActionBar,
  RowPlate,
  RowPlates,
  Scale,
  Screen,
  ScreenHeader,
  Section,
  useActionBarHeight,
} from '@/components';
import { ReadinessPill } from '@/components/pill';
import { useRows } from '@/data/live';
import { saveCheckIn } from '@/data/mutations/readiness';
import { startSession } from '@/data/mutations/sessions';
import { latestCheckInQuery } from '@/data/queries/readiness';
import { routineExercisesQuery } from '@/data/queries/routines';
import { useSessionRunning } from '@/data/running';
import { useActiveSchedule } from '@/data/schedule';
import { nextScheduled } from '@/lib/program';
import {
  type Answers,
  dayStart,
  type Energy,
  readinessStep,
  type Sleep,
  type Soreness,
} from '@/lib/readiness';

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

/**
 * Lab 37 D3. Optional and never a gate on Start. Answers save as soon as all
 * three are set, and the call is a chip: a word on a tint, not a score, so a
 * guess is not drawn like a measurement (§0).
 */
export default function CheckInScreen() {
  const actionBar = useActionBarHeight();
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

  const lifts = useRows(
    useMemo(() => routineExercisesQuery(routineId), [routineId]),
    [routineId],
  );
  const running = useSessionRunning();

  const step =
    draft.sleep && draft.soreness && draft.energy
      ? readinessStep({ sleep: draft.sleep, soreness: draft.soreness, energy: draft.energy })
      : null;

  // Unloaded is not empty: `lifts` and `running` are null until they answer, and
  // an empty routine has nothing to start, so it gets the plain Done bar.
  const resume = running === true;
  const canStart = next !== null && (resume || (lifts !== null && lifts.length > 0));

  const start = () => {
    if (!next) return;
    if (resume) {
      router.push('/live');
      return;
    }
    try {
      startSession({ routineId: next.routine.id });
      router.replace('/live');
    } catch {
      router.push('/live');
    }
  };

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader title="Check-in" onBack={() => router.back()} />

        <Section first plated={false}>
          <RowPlates tinted>
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

        {step ? (
          <Section plated={false}>
            <ReadinessPill step={step} />
          </Section>
        ) : null}
      </Screen>

      {canStart ? (
        <ActionBar
          primary={resume ? 'Resume' : 'Start'}
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
