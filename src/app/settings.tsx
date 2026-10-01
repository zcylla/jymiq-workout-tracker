import { router } from 'expo-router';
import { useMemo, useState } from 'react';

import {
  DurationSheet,
  ListRow,
  NumberSheet,
  OptionSheet,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  Toggle,
} from '@/components';
import { ReadinessPill } from '@/components/pill';
import { useRows } from '@/data/live';
import { latestCheckInQuery } from '@/data/queries/readiness';
import { setSettings, useSettings } from '@/data/settings';
import { resolveKeypadValue } from '@/lib/keypad';
import { dayStart, readinessStep } from '@/lib/readiness';
import { LOAD_STEPS_KG, loadDisplayStep, makeScale, WEEKLY_GOAL_SCALE } from '@/lib/scale';
import { DEFAULT_SETS_MAX } from '@/lib/settings';
import { formatRest } from '@/lib/time';

const SETS_SCALE = makeScale(1, DEFAULT_SETS_MAX, 1, 1, 1);

/**
 * Lab 37 D4. §0 keeps Settings off the tab bar — it is the gear in the Today
 * header, because you open it twice a year.
 *
 * Every row is its own plate: Lab 42's P3 case, and the one where row plates
 * argue best, because settings rows are not a list — they are a stack of
 * unrelated controls that happen to be adjacent.
 *
 * **The board draws more than this, and the difference is deliberate.** It has
 * a DISTANCE and a LANGUAGE row, a PLATES section with a colour scheme and a
 * plate-maths switch, and a warm-up ramps toggle. None of those has anything to
 * act on: no screen renders a distance or a second language, and `solvePlates`,
 * `warmupRamp` and `PLATE_COLORS` are pure functions with tests and no caller.
 * A switch that toggles nothing is worse than a missing switch — this app has
 * shipped two buttons that rendered perfectly and did nothing — so they arrive
 * with the features they configure, not before.
 */
export default function SettingsScreen() {
  const settings = useSettings();
  const unit = settings.weightUnit.toUpperCase();
  const incrementLabel = (stepKg: number) =>
    `${loadDisplayStep(stepKg, settings.weightUnit)} ${unit}`;
  const [picking, setPicking] = useState<'compound' | 'isolation' | null>(null);
  const [goal, setGoal] = useState({ open: false, n: 0 });
  const [pickingIncrement, setPickingIncrement] = useState(false);
  const [pickingSets, setPickingSets] = useState(false);

  const today = useMemo(() => dayStart(nowMs()), []);
  const checkIns = useRows(
    useMemo(() => latestCheckInQuery(today), [today]),
    [today],
  );
  const checkIn = checkIns?.[0];
  const step = checkIn
    ? readinessStep({ sleep: checkIn.sleep, soreness: checkIn.soreness, energy: checkIn.energy })
    : null;

  return (
    <>
      <Screen>
        <ScreenHeader title="Settings" onBack={() => router.back()} />

        <Section first label="UNITS" plated={false}>
          <RowPlates>
            <RowPlate
              onPress={() =>
                setSettings({ weightUnit: settings.weightUnit === 'kg' ? 'lb' : 'kg' })
              }
            >
              <ListRow
                quiet
                title="Weight"
                value={settings.weightUnit.toUpperCase()}
                chevron={false}
              />
            </RowPlate>
          </RowPlates>
        </Section>

        <Section label="TRAINING" plated={false}>
          <RowPlates>
            <RowPlate onPress={() => router.push('/check-in')}>
              <ListRow
                quiet
                title="Check-in"
                right={step ? <ReadinessPill step={step} /> : undefined}
              />
            </RowPlate>
            <RowPlate onPress={() => setGoal((g) => ({ open: true, n: g.n + 1 }))}>
              <ListRow
                quiet
                title="Weekly goal"
                value={settings.weeklyGoal === null ? '\u2014' : `${settings.weeklyGoal} / WK`}
              />
            </RowPlate>
            <RowPlate>
              <Toggle
                label="Track RPE"
                on={settings.trackRpe}
                onToggle={(trackRpe) => setSettings({ trackRpe })}
              />
            </RowPlate>
            <RowPlate onPress={() => setPicking('compound')}>
              <ListRow quiet title="Rest · compound" value={formatRest(settings.restCompoundSec)} />
            </RowPlate>
            <RowPlate onPress={() => setPicking('isolation')}>
              <ListRow
                quiet
                title="Rest · isolation"
                value={formatRest(settings.restIsolationSec)}
              />
            </RowPlate>
            <RowPlate>
              <Toggle
                label="Tap opens keypad"
                on={settings.tapOpensKeypad}
                onToggle={(tapOpensKeypad) => setSettings({ tapOpensKeypad })}
              />
            </RowPlate>
            <RowPlate onPress={() => setPickingIncrement(true)}>
              <ListRow
                quiet
                title="Weight increment"
                value={incrementLabel(settings.weightIncrementKg)}
              />
            </RowPlate>
            <RowPlate onPress={() => setPickingSets(true)}>
              <ListRow quiet title="Default sets" value={String(settings.defaultSets)} />
            </RowPlate>
            <RowPlate>
              <Toggle
                label="Keep screen on"
                on={settings.keepScreenOn}
                onToggle={(keepScreenOn) => setSettings({ keepScreenOn })}
              />
            </RowPlate>
            <RowPlate>
              <Toggle
                label="Workout notification"
                on={settings.liveNotification}
                onToggle={(liveNotification) => setSettings({ liveNotification })}
              />
            </RowPlate>
          </RowPlates>
        </Section>

        <Section plated={false}>
          <RowPlates>
            <RowPlate onPress={() => router.push('/sign-in')}>
              <ListRow quiet title="Account" />
            </RowPlate>
          </RowPlates>
        </Section>
      </Screen>

      <DurationSheet
        open={picking !== null}
        title={picking === 'compound' ? 'Rest · compound' : 'Rest · isolation'}
        value={picking === 'compound' ? settings.restCompoundSec : settings.restIsolationSec}
        onConfirm={(sec) =>
          setSettings(picking === 'compound' ? { restCompoundSec: sec } : { restIsolationSec: sec })
        }
        onClose={() => setPicking(null)}
      />
      <NumberSheet
        key={goal.n}
        open={goal.open}
        onClose={() => setGoal((g) => ({ ...g, open: false }))}
        label="WEEKLY GOAL"
        unit="PER WEEK"
        was={settings.weeklyGoal === null ? '\u2014' : String(settings.weeklyGoal)}
        resolve={(entered) => resolveKeypadValue(entered, WEEKLY_GOAL_SCALE)}
        onConfirm={(weeklyGoal) => setSettings({ weeklyGoal })}
        onClear={() => setSettings({ weeklyGoal: null })}
      />
      <OptionSheet
        open={pickingIncrement}
        title="Weight increment"
        options={LOAD_STEPS_KG.map((step) => ({ value: step, label: incrementLabel(step) }))}
        value={settings.weightIncrementKg}
        onPick={(weightIncrementKg) => setSettings({ weightIncrementKg })}
        onClose={() => setPickingIncrement(false)}
      />
      <NumberSheet
        key={`sets-${pickingSets}`}
        open={pickingSets}
        label="DEFAULT SETS"
        unit="SETS"
        was={String(settings.defaultSets)}
        resolve={(entered) => resolveKeypadValue(entered, SETS_SCALE)}
        onConfirm={(defaultSets) => setSettings({ defaultSets })}
        onClose={() => setPickingSets(false)}
      />
    </>
  );
}

function nowMs(): number {
  return Date.now();
}
