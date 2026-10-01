import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type ScrollView, Text, View } from 'react-native';

import {
  Delta,
  ExerciseLog,
  LineChart,
  Screen,
  ScreenHeader,
  Section,
  Segmented,
  StatTiles,
} from '@/components';
import { PeriodTabs } from '@/components/period-tabs';
import { exerciseArt } from '@/data/exercise-art';
import { useRows } from '@/data/live';
import { exerciseMusclesQuery, exerciseQuery, exerciseSetsQuery } from '@/data/queries/exercises';
import { useSettings } from '@/data/settings';
import {
  axisLabels,
  buckets,
  comparePeriods,
  type Granularity,
  type Metric,
  periodChange,
  progressSeries,
  regression,
  type Trend,
  trendOf,
} from '@/lib/exercise-progress';
import { exerciseNumbers, repMaxes, WINDOW_WEEKS } from '@/lib/exercise-stats';
import { formatPrValue } from '@/lib/pr';
import { sessionDateLabel } from '@/lib/time';
import { formatWeight, toDisplay, toKg } from '@/lib/units';
import { formatTonnage, formatTonnageAxis } from '@/lib/volume';
import { color, motion, size, space, text } from '@/theme';

const DASH = '—';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'e1rm', label: '1RM' },
  { key: 'weight', label: 'WEIGHT' },
  { key: 'volume', label: 'VOLUME' },
  { key: 'reps', label: 'REPS' },
];

const GRANULARITIES: { key: Granularity; label: string }[] = [
  { key: 'day', label: 'DAY' },
  { key: 'week', label: 'WEEK' },
  { key: 'month', label: 'MONTH' },
  { key: 'year', label: 'YEAR' },
  { key: 'all', label: 'ALL' },
];

const COMPARED: Record<Exclude<Granularity, 'all'>, string> = {
  day: 'LATEST DAY VS PREVIOUS',
  week: 'THIS WEEK VS LAST',
  month: 'THIS MONTH VS LAST',
  year: 'THIS YEAR VS LAST',
};

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

  const [metric, setMetric] = useState<Metric>('e1rm');
  const [gran, setGran] = useState<Granularity>('week');
  const binned = useMemo(() => buckets(logged ?? [], gran), [logged, gran]);
  const series = useMemo(
    () => progressSeries(binned, gran, metric, now),
    [binned, gran, metric, now],
  );
  const fit = useMemo(() => regression(series.points), [series]);
  const compared = useMemo(() => comparePeriods(binned, gran, now), [binned, gran, now]);
  const peakKg = Math.max(0, ...series.points.map((p) => p.value));
  const formatY = (v: number) =>
    metric === 'reps'
      ? String(v)
      : metric === 'volume'
        ? formatTonnageAxis(v, peakKg, unit)
        : metric === 'e1rm'
          ? formatPrValue('best_e1rm', v, unit)
          : formatWeight(v, unit);
  const { current, previous } = compared;
  const toUnit = (kg: number) => toDisplay(kg, unit);

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

      <Section label="YOUR NUMBERS" tone="raised" hero pad={13}>
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

      {binned.length ? (
        <>
          <View
            onLayout={(e) => {
              if (focus === 'stats') {
                scrollRef.current?.scrollTo({ y: e.nativeEvent.layout.y, animated: true });
              }
            }}
          >
            <Section
              label={`PROGRESS · ${metric === 'reps' ? 'REPS' : unitLabel}`}
              right={<TrendFlag trend={trendOf(series.points)} />}
              plated={false}
            >
              <Segmented options={METRICS} value={metric} onChange={setMetric} />
              <PeriodTabs options={GRANULARITIES} value={gran} onChange={setGran} />
              <LineChart
                points={series.points}
                slots={series.slots}
                trend={fit}
                xLabels={axisLabels(series, gran)}
                format={formatY}
                inspection={{
                  starts: series.starts,
                  buckets: binned,
                  metric,
                  granularity: gran,
                  unit,
                }}
              />
            </Section>
          </View>

          {gran !== 'all' ? (
            <Section label={COMPARED[gran]} plated={false}>
              <StatTiles
                items={[
                  {
                    label: 'BEST e1RM',
                    value:
                      current?.e1rmKg == null
                        ? DASH
                        : formatPrValue('best_e1rm', current.e1rmKg, unit),
                    visual: <Text style={text.label}>{unitLabel}</Text>,
                    below: (
                      <Change
                        amount={periodChange(
                          current?.e1rmKg ?? null,
                          previous?.e1rmKg ?? null,
                          toUnit,
                        )}
                        format={String}
                      />
                    ),
                  },
                  {
                    label: 'VOLUME',
                    value: current ? formatTonnage(current.volumeKg, unit) : DASH,
                    below: (
                      <Change
                        amount={periodChange(
                          current?.volumeKg ?? null,
                          previous?.volumeKg ?? null,
                          toUnit,
                        )}
                        format={(n) => formatTonnage(toKg(n, unit), unit)}
                      />
                    ),
                  },
                  {
                    label: 'MOST REPS',
                    value: current ? String(current.reps) : DASH,
                    below: (
                      <Change
                        amount={periodChange(current?.reps ?? null, previous?.reps ?? null)}
                        format={String}
                      />
                    ),
                  },
                  {
                    label: 'SESSIONS',
                    value: current ? String(current.sessions) : DASH,
                    below: (
                      <Change
                        amount={periodChange(current?.sessions ?? null, previous?.sessions ?? null)}
                        format={String}
                      />
                    ),
                  },
                ]}
              />
            </Section>
          ) : null}
        </>
      ) : null}

      <Section label={`REP MAXES · ${unitLabel}`} plated={false}>
        <View>
          {maxes.map((m) => (
            <View
              key={m.reps}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: size.readRow,
                paddingVertical: 6,
                gap: 10,
              }}
            >
              <Text style={text.body}>{`${m.reps}RM`}</Text>
              <View style={{ flex: 1 }} />
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={[text.num, m.source === null && { color: color.lo }]}>
                  {m.weightKg === null
                    ? DASH
                    : `${
                        m.source === 'est'
                          ? formatPrValue('best_e1rm', m.weightKg, unit)
                          : formatWeight(m.weightKg, unit)
                      } ${unitLabel}`}
                </Text>
                <Text style={text.caption}>
                  {m.source === 'est'
                    ? 'EST'
                    : m.at === null
                      ? ' '
                      : sessionDateLabel(m.at, { upper: true, now, year: true, weekday: false })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Section>
      <ExerciseLog exerciseId={id} />

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

function TrendFlag({ trend }: { trend: Trend | null }) {
  if (trend === null) return null;
  if (trend === 'flat') return <Text style={text.label}>FLAT</Text>;
  return <Delta value={trend === 'up' ? 'UP' : 'DOWN'} positive={trend === 'up'} />;
}

/** A signed change in whole units. A dash when either period has no data, never a baseline made up. */
function Change({ amount, format }: { amount: number | null; format: (abs: number) => string }) {
  if (amount === null) return <Text style={[text.numSm, { color: color.lo }]}>{DASH}</Text>;
  if (amount === 0) return <Text style={text.numSm}>0</Text>;
  return (
    <Delta value={`${amount > 0 ? '+' : '−'}${format(Math.abs(amount))}`} positive={amount > 0} />
  );
}

function nowMs(): number {
  return Date.now();
}
