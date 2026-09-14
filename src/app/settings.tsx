import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import {
  ListRow,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  Sheet,
  Toggle,
} from '@/components';
import { setSettings, useSettings } from '@/data/settings';
import { REST_CHOICES } from '@/lib/settings';
import { formatRest } from '@/lib/time';
import { text } from '@/theme';

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
  const [picking, setPicking] = useState<'compound' | 'isolation' | null>(null);

  return (
    <>
      <Screen>
        <ScreenHeader title="Settings" kicker="APP" onBack={() => router.back()} />

        <Section first label="UNITS" plated={false}>
          <RowPlates>
            <RowPlate
              onPress={() =>
                setSettings({ weightUnit: settings.weightUnit === 'kg' ? 'lb' : 'kg' })
              }
            >
              <ListRow
                title="Weight"
                meta="KILOGRAMS ARE ALWAYS WHAT IS STORED"
                value={settings.weightUnit.toUpperCase()}
                chevron={false}
              />
            </RowPlate>
          </RowPlates>
        </Section>

        <Section label="TRAINING" plated={false}>
          <RowPlates>
            <RowPlate>
              <Toggle
                label="Track RPE"
                meta={
                  settings.trackRpe
                    ? 'ON — LOGS UNSET UNLESS YOU DIAL IT'
                    : 'OFF — SET IT ONLY IF YOU USE IT'
                }
                on={settings.trackRpe}
                onToggle={(trackRpe) => setSettings({ trackRpe })}
              />
            </RowPlate>
            <RowPlate onPress={() => setPicking('compound')}>
              <ListRow
                title="Default rest · compound"
                meta="WHEN THE ROUTINE AND THE EXERCISE SAY NOTHING"
                value={formatRest(settings.restCompoundSec)}
              />
            </RowPlate>
            <RowPlate onPress={() => setPicking('isolation')}>
              <ListRow
                title="Default rest · isolation"
                meta="THE SAME, FOR A LIFT THAT NEEDS LESS"
                value={formatRest(settings.restIsolationSec)}
              />
            </RowPlate>
            <RowPlate>
              <Toggle
                label="Tap opens the keypad"
                meta="OTHERWISE LONG-PRESS · TAP ARMS THE TAPE"
                on={settings.tapOpensKeypad}
                onToggle={(tapOpensKeypad) => setSettings({ tapOpensKeypad })}
              />
            </RowPlate>
          </RowPlates>
        </Section>

        <Section label="ACCOUNT" plated={false}>
          <RowPlates>
            <RowPlate onPress={() => router.push('/sign-in')}>
              <ListRow title="Account and your data" meta="SYNC, EXPORT AND RESTORE" />
            </RowPlate>
          </RowPlates>
          <Text style={text.prose}>
            Your workouts are on this phone. Export is the only copy that leaves it.
          </Text>
        </Section>
      </Screen>

      <Sheet open={picking !== null} onClose={() => setPicking(null)}>
        <RowPlates>
          {REST_CHOICES.map((sec) => (
            <RowPlate
              key={sec}
              onPress={() => {
                setSettings(
                  picking === 'compound' ? { restCompoundSec: sec } : { restIsolationSec: sec },
                );
                setPicking(null);
              }}
            >
              <ListRow title={formatRest(sec)} chevron={false} />
            </RowPlate>
          ))}
        </RowPlates>
      </Sheet>
    </>
  );
}
