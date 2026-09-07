import { router } from 'expo-router';
import { Text } from 'react-native';

import { Screen, ScreenHeader, Section } from '@/components';
import { text } from '@/theme';

/**
 * A pushed detail screen, sibling of `(tabs)` rather than inside it, so it
 * covers the tab bar instead of sitting under it. Phase 5 fills it in; for now
 * it is the shell's proof that a push loses the bar.
 */
export default function LibraryScreen() {
  return (
    <Screen>
      <ScreenHeader title="Library" kicker="EXERCISES" onBack={() => router.back()} />
      <Section label="EXERCISES" plated={false}>
        <Text style={text.prose}>
          Pushed over the tabs, so the bar is gone and the primary action can take that plane.
        </Text>
      </Section>
    </Screen>
  );
}
