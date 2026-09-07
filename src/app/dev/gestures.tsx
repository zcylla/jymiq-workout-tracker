import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader, Section } from '@/components';
import { color, containment, size, space, text } from '@/theme';

/**
 * Phase 6's first question, and the only one a screenshot cannot answer: does
 * Android's gesture navigation eat the live screen's two axes before the app
 * sees them? Horizontal = sets, and the system back gesture is also horizontal
 * from either edge. The K3 ladder sits in the left edge, which is where the
 * system is most jealous.
 *
 * What to read off it:
 *   MIN X / MAX X  — the dead band. A swipe the system took never appears here,
 *                    so the smallest start x the app ever sees is the width of
 *                    the exclusion zone on that side.
 *   CANCELLED      — the worse failure: the app begins the gesture, the system
 *                    takes it mid-drag, and the set is half-swiped.
 *   LADDER         — a tap at x < 28 arriving is the ladder's tap route living.
 *                    A drag off a ladder tick arriving is the drag route living.
 *   BACK           — whether the app is offered the back event at all, which is
 *                    what a "discard this session?" confirm depends on.
 */
type Event = { at: number; kind: string; x: number; y: number; dx: number; dy: number };

export default function GesturesScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<Event[]>([]);
  const [backs, setBacks] = useState(0);
  const [blockBack, setBlockBack] = useState(true);

  const log = (kind: string, x = 0, y = 0, dx = 0, dy = 0) =>
    setEvents((prev) => [{ at: Date.now(), kind, x, y, dx, dy }, ...prev].slice(0, 6));

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setBacks((n) => n + 1);
      log('BACK', 0, 0, 0, 0);
      return blockBack;
    });
    return () => sub.remove();
  }, [blockBack]);

  // runOnJS keeps this a probe rather than a worklet exercise — the numbers are
  // read by eye, not driven into an animation.
  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(6)
    .onBegin((e) => log('begin', e.x, e.y))
    .onEnd((e) => log('end', e.x, e.y, e.translationX, e.translationY))
    .onFinalize((e, ok) => {
      if (!ok) log('CANCELLED', e.x, e.y, e.translationX, e.translationY);
    });

  const starts = events.filter((e) => e.kind === 'begin').map((e) => e.x);
  const minX = starts.length ? Math.min(...starts) : null;
  const maxX = starts.length ? Math.max(...starts) : null;
  const cancels = events.filter((e) => e.kind === 'CANCELLED').length;

  const stat = (label: string, value: string) => (
    <View key={label} style={{ flex: 1, gap: 2 }}>
      <Text style={text.label}>{label}</Text>
      <Text style={text.numTile}>{value}</Text>
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.ground,
        paddingHorizontal: space.pad,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <ScreenHeader title="Gestures" kicker="PROBE" onBack={() => router.back()} />

      <Section label="READINGS" plated={false}>
        <View style={{ flexDirection: 'row', gap: space.within }}>
          {stat('MIN X', minX === null ? '—' : minX.toFixed(0))}
          {stat('MAX X', maxX === null ? '—' : `${(width - maxX).toFixed(0)} R`)}
          {stat('CANCEL', String(cancels))}
          {stat('BACK', String(backs))}
        </View>
        <Pressable
          onPress={() => setBlockBack((b) => !b)}
          style={[
            containment.rowPlate,
            {
              height: size.hit,
              justifyContent: 'center',
              paddingHorizontal: space.within,
              marginTop: space.within,
            },
          ]}
        >
          <Text style={text.body}>
            {blockBack ? 'Back is BLOCKED — tap to release' : 'Back passes through — tap to block'}
          </Text>
        </Pressable>
      </Section>

      <Section label="PLANE" plated={false}>
        <GestureDetector gesture={pan}>
          <View
            style={{
              height: 260,
              marginHorizontal: -space.pad,
              backgroundColor: color.panel,
              overflow: 'hidden',
            }}
          >
            {/* The K3 ladder, at the edge where the system contests it. */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 28,
                justifyContent: 'center',
              }}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => log(`LADDER ${n}`)}
                  style={{ height: size.hit, justifyContent: 'center', paddingLeft: 8 }}
                >
                  <Text style={text.meta}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={text.meta}>swipe here, and from each edge inward</Text>
            </View>
          </View>
        </GestureDetector>
      </Section>

      <Section label="LOG" plated={false}>
        {events.length === 0 ? (
          <Text style={text.prose}>Nothing yet.</Text>
        ) : (
          events.map((e) => (
            <Text key={e.at + e.kind} style={text.meta}>
              {e.kind.padEnd(10)} x{e.x.toFixed(0).padStart(4)} y{e.y.toFixed(0).padStart(4)}
              {'  d'}
              {e.dx.toFixed(0).padStart(5)},{e.dy.toFixed(0).padStart(5)}
            </Text>
          ))
        )}
      </Section>
    </View>
  );
}
