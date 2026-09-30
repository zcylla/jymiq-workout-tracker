import { router } from 'expo-router';
import { useState } from 'react';

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
