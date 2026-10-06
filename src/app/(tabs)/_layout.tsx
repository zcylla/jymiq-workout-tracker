import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';

import { StartButton, TabBar, TabBarProvider, TabItem } from '@/components';
import { useTabBlurMotionListeners } from '@/components/screen-blur';
import { useStartSession } from '@/data/start';

/**
 * W2 — four labelled tabs on one plane with an inset start button.
 *
 * The hidden `TabList` is what declares the routes: `Tabs` walks its children
 * looking for literal `TabTrigger` elements inside a literal `TabList`, so the
 * declarations cannot be wrapped in a component of ours or they register
 * nothing, silently. The triggers that actually *draw* the bar can live
 * anywhere under `Tabs`, which is what makes a custom bar possible at all.
 *
 * `style` on `Tabs` replaces its own rather than merging, so `flex: 1` has to be
 * restated here or the whole navigator collapses.
 */
export default function TabsLayout() {
  const listeners = useTabBlurMotionListeners();
  const start = useStartSession({ empty: true });

  return (
    <TabBarProvider>
      <Tabs
        style={{ flex: 1 }}
        options={{ backBehavior: 'firstRoute', screenListeners: listeners }}
      >
        <TabSlot />

        <TabList style={{ display: 'none' }}>
          <TabTrigger name="today" href="/" />
          <TabTrigger name="session" href="/session" />
          <TabTrigger name="history" href="/history" />
          <TabTrigger name="load" href="/load" />
        </TabList>

        <TabBar onStart={start}>
          <TabTrigger name="today" asChild>
            <TabItem tab="today" />
          </TabTrigger>
          <TabTrigger name="session" asChild>
            <TabItem tab="session" />
          </TabTrigger>

          {/* Not a tab — it resumes, or starts an empty session, which owns the whole plane. */}
          <StartButton onPress={start} />

          <TabTrigger name="history" asChild>
            <TabItem tab="history" />
          </TabTrigger>
          <TabTrigger name="load" asChild>
            <TabItem tab="load" />
          </TabTrigger>
        </TabBar>
      </Tabs>
    </TabBarProvider>
  );
}
