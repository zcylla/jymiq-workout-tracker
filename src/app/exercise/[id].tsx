import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type ScrollView, Text, View } from 'react-native';

import { ColumnChart, Delta, Screen, ScreenHeader, Section, StatTiles } from '@/components';
import { exerciseArt } from '@/data/exercise-art';
import { useRows } from '@/data/live';
import {
  exerciseE1rmQuery,
  exerciseMusclesQuery,
  exerciseQuery,
  exerciseSetsQuery,
} from '@/data/queries/exercises';
import { useSettings } from '@/data/settings';
import { e1rmTakeaway } from '@/lib/e1rm';
import { exerciseNumbers, repMaxes, WINDOW_WEEKS } from '@/lib/exercise-stats';
import { formatPrValue } from '@/lib/pr';
import { sessionDateLabel } from '@/lib/time';
import { formatWeight, toDisplay } from '@/lib/units';
import { color, motion, size, space, text } from '@/theme';

const DASH = '—';

/**
 * Lab 35 B2 (= Lab 39 Q1). A pushed detail screen: sibling of `(tabs)`, so it
 * loses the tab bar and the primary action takes that plane.
 *
 * WHAT TO DO NEXT, the board's last section, is not built: it is a model's
 * advice, which needs the owner's call on what it may say.
 */
export default function ExerciseScreen() {
  // `focus=stats` is the live screen's STATS: the same page, opened on the 1RM chart.
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: 'stats' }>();
  const scrollRef = useRef<ScrollView>(null);
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
  const logged = useRows(
    useMemo(() => exerciseSetsQuery(id), [id]),
    [id],
  );
  const now = useMemo(() => (logged ? nowMs() : 0), [logged]);
  const unit = useSettings().weightUnit;
  const unitLabel = unit.toUpperCase();
  const numbers = exerciseNumbers(logged ?? [], now, unit);
  const maxes = repMaxes(logged ?? []);
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
    <Screen scrollRef={scrollRef}>
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

      <Section label="YOUR NUMBERS" tone="raised" pad={13}>
        <StatTiles
          surface="raised"
          items={[
            {
              label: 'BEST e1RM',
              value:
                numbers.bestE1rmKg === null
                  ? DASH
                  : formatPrValue('best_e1rm', numbers.bestE1rmKg, unit),
              tone: numbers.bestE1rmKg === null ? undefined : 'accent',
              visual: <Text style={text.label}>{unitLabel}</Text>,
              below:
                numbers.e1rmGain === null ? undefined : <Delta value={`+${numbers.e1rmGain}`} />,
              pending: logged === null,
            },
            {
              label: 'TOP SET',
              value: numbers.topSetKg === null ? DASH : formatWeight(numbers.topSetKg, unit),
              visual: <Text style={text.label}>{unitLabel}</Text>,
              pending: logged === null,
            },
            {
              label: 'SESSIONS',
              value: String(numbers.sessions),
              tone: numbers.sessions === 0 ? 'lo' : undefined,
              visual: <Text style={text.label}>{`/ ${WINDOW_WEEKS} WK`}</Text>,
              pending: logged === null,
            },
            {
              label: 'FREQUENCY',
              value: numbers.perWeek === null ? DASH : numbers.perWeek.toFixed(1),
              visual: <Text style={text.label}>/ WK</Text>,
              pending: logged === null,
            },
          ]}
        />
      </Section>

      {bests.length >= 1 ? (
        <View
          onLayout={(e) => {
            if (focus === 'stats') {
              scrollRef.current?.scrollTo({ y: e.nativeEvent.layout.y, animated: true });
            }
          }}
        >
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
                bests.length >= 2
                  ? sessionDateLabel(sessionsNewestFirst[0].at, { upper: true })
                  : ''
              }
            />
          </Section>
        </View>
      ) : null}

      <Section label={`REP MAXES · ${unitLabel}`} plated={false}>
        <View>
          {maxes.map((m) => (
            <View
              key={m.reps}
              style={{ flexDirection: 'row', alignItems: 'center', height: size.readRow, gap: 10 }}
            >
              <Text style={text.body}>{`${m.reps}RM`}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[text.num, m.source === null && { color: color.lo }]}>
                {m.weightKg === null
                  ? DASH
                  : m.source === 'est'
                    ? formatPrValue('best_e1rm', m.weightKg, unit)
                    : formatWeight(m.weightKg, unit)}
              </Text>
              <Text style={[text.label, { width: 92, textAlign: 'right' }]}>
                {m.source === 'est'
                  ? 'EST'
                  : m.at === null
                    ? ''
                    : sessionDateLabel(m.at, { upper: true, now })}
              </Text>
            </View>
          ))}
        </View>
      </Section>

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

function nowMs(): number {
  return Date.now();
}
