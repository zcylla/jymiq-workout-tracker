import { router } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';

import { StartButton, TabBar, TabItem } from '@/components';

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
  return (
    <Tabs style={{ flex: 1 }} options={{ backBehavior: 'firstRoute' }}>
      <TabSlot />

      <TabList style={{ display: 'none' }}>
        <TabTrigger name="today" href="/" />
        <TabTrigger name="session" href="/session" />
        <TabTrigger name="strength" href="/strength" />
        <TabTrigger name="load" href="/load" />
      </TabList>

      <TabBar>
        <TabTrigger name="today" asChild>
          <TabItem icon="today" label="Today" />
        </TabTrigger>
        <TabTrigger name="session" asChild>
          <TabItem icon="session" label="Session" />
        </TabTrigger>

        {/* Not a tab — it pushes the live session, which owns the whole plane. */}
        <StartButton onPress={() => router.push('/live')} />

        <TabTrigger name="strength" asChild>
          <TabItem icon="strength" label="Strength" />
        </TabTrigger>
        <TabTrigger name="load" asChild>
          <TabItem icon="load" label="Load" />
        </TabTrigger>
      </TabBar>
    </Tabs>
  );
}
