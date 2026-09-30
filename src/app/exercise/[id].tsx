import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ColumnChart, Screen, ScreenHeader, Section } from '@/components';
import { exerciseArt } from '@/data/exercise-art';
import { useRows } from '@/data/live';
import { exerciseE1rmQuery, exerciseMusclesQuery, exerciseQuery } from '@/data/queries/exercises';
import { useSettings } from '@/data/settings';
import { e1rmTakeaway } from '@/lib/e1rm';
import { sessionDateLabel } from '@/lib/time';
import { toDisplay } from '@/lib/units';
import { color, motion, space, text } from '@/theme';

/**
 * Lab 35 B2 (= Lab 39 Q1). A pushed detail screen: sibling of `(tabs)`, so it
 * loses the tab bar and the primary action takes that plane.
 *
 * The estimated-1RM chart is here; the board's number tiles and rep maxes are
 * not built yet.
 */
export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: found } = useLiveQuery(
    useMemo(() => exerciseQuery(id), [id]),
    [id],
  );
  const { data: muscles } = useLiveQuery(
    useMemo(() => exerciseMusclesQuery(id), [id]),
    [id],
  );
  const rows = useRows(
    useMemo(() => exerciseE1rmQuery(id), [id]),
    [id],
  );
  const unit = useSettings().weightUnit;
  const exercise = found?.[0];
  const sessionsNewestFirst = rows ?? [];
  const bests = sessionsNewestFirst
    .flatMap((r) => (r.bestE1rmKg === null ? [] : [r.bestE1rmKg]))
    .reverse();

  const frames = exerciseArt(id);
  const cues: string[] = Array.isArray(exercise?.cues) ? exercise.cues : [];
  const prime = muscles?.filter((m) => m.role === 'prime').map((m) => m.muscle) ?? [];
  const assist = muscles?.filter((m) => m.role === 'assist').map((m) => m.muscle) ?? [];

  return (
    <Screen>
      <ScreenHeader
        title={exercise?.name ?? ''}
        kicker={
          exercise ? `${exercise.equipment.toUpperCase()} · ${exercise.kind.toUpperCase()}` : ''
        }
        onBack={() => router.back()}
      />

      {/* Lab 39 Q1: demonstration and instruction above statistics, which is
            the order every reference app uses. §0 plates it — the demo is one of
            this screen's two main components. */}
      {frames ? (
        <Section first>
          <Demo frames={frames} />
        </Section>
      ) : null}

      {/* HOW TO carries the same text as cues; the description is only the fallback. */}
      {exercise?.description && cues.length === 0 ? (
        <Section plated={false}>
          <Text style={text.body}>{exercise.description}</Text>
        </Section>
      ) : null}

      {prime.length ? (
        <Section label="MUSCLES">
          <Text style={text.body}>{prime.join(' · ').toUpperCase()}</Text>
          {assist.length ? <Text style={text.prose}>{assist.join(' · ')}</Text> : null}
        </Section>
      ) : null}

      {cues.length ? (
        <Section label="HOW TO" plated={false}>
          <View style={{ gap: space.within }}>
            {cues.map((cue, i) => (
              <View key={cue} style={{ flexDirection: 'row', gap: 11 }}>
                <Text style={[text.meta, { width: 18 }]}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={[text.body, { flex: 1 }]}>{cue}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {bests.length >= 1 ? (
        <Section
          label={bests.length >= 2 ? `1RM ${e1rmTakeaway(bests, unit)}` : '1RM'}
          plated={false}
        >
          <ColumnChart
            values={bests.map((kg) => toDisplay(kg, unit))}
            format={(v) => String(Math.round(v))}
            xFirst={sessionDateLabel(sessionsNewestFirst[sessionsNewestFirst.length - 1].at, {
              upper: true,
            })}
            xLast={
              bests.length >= 2 ? sessionDateLabel(sessionsNewestFirst[0].at, { upper: true }) : ''
            }
          />
        </Section>
      ) : null}

      {/* CC BY-SA asks for credit wherever the work is distributed, and the
            app is where this app distributes it. */}
      {frames ? (
        <Section plated={false}>
          <Text style={text.meta}>ILLUSTRATION BY BRYL LIM · CC BY-SA 4.0</Text>
        </Section>
      ) : null}
    </Screen>
  );
}

/**
 * The three frames are a movement, not three pictures, so the block loops them.
 * Plain state on a timer rather than Reanimated: this is one swap every ~380ms
 * on the JS thread, not a gesture, and a shared value would buy nothing.
 */
function Demo({ frames }: { frames: readonly [number, number, number] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % frames.length), motion.slow);
    return () => clearInterval(t);
  }, [frames.length]);

  return (
    <View style={{ alignItems: 'center' }}>
      <Image
        source={frames[i]}
        style={{ width: DEMO, height: DEMO }}
        contentFit="contain"
        tintColor={color.hi}
        cachePolicy="memory-disk"
        transition={{ duration: motion.slow, effect: 'cross-dissolve' }}
      />
    </View>
  );
}

const DEMO = 190;
