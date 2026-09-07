import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import migrations from '@/../drizzle/migrations';
import { db } from '@/data/db';
import { authCodeFromUrl, exchangeAuthCode } from '@/data/supabase';
import { color, space, text } from '@/theme';

/**
 * `(tabs)` is the anchor, so a deep link into a detail route still has the tab
 * shell underneath it to go back to. SDK 57 renamed this from `initialRouteName`.
 */
export const unstable_settings = { anchor: '(tabs)' };

/**
 * The auth redirect is handled here rather than on the sign-in screen because a
 * magic link opened from an email client can cold-start the app, and whatever
 * route it lands on is not necessarily that screen — in a dev client it is not
 * even a route that matches, since `Linking.createURL` splices Metro's host into
 * the path. At the root the code is exchanged wherever the link arrives.
 */
function useAuthDeepLink() {
  const url = Linking.useLinkingURL();
  useEffect(() => {
    const code = authCodeFromUrl(url);
    if (code) exchangeAuthCode(code);
  }, [url]);
}

export default function RootLayout() {
  useAuthDeepLink();
  // The render is gated on migrations rather than racing them, and a failure is
  // shown rather than swallowed — a half-migrated database is the one state
  // worth refusing to run on.
  const { success, error } = useMigrations(db, migrations);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.ground }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar style="light" />
        {error ? (
          <View
            style={{ flex: 1, justifyContent: 'center', padding: space.pad, gap: space.within }}
          >
            <Text style={text.label}>DATABASE</Text>
            <Text style={text.lead}>The database could not be migrated.</Text>
            <Text style={text.prose}>{error.message}</Text>
          </View>
        ) : !success ? (
          <View style={{ flex: 1, backgroundColor: color.ground }} />
        ) : (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.ground },
              animation: 'slide_from_right',
            }}
          >
            {/* Detail routes are siblings of `(tabs)` and need no options — a push
                covers the tab shell entirely, which is how they lose the bar.
                The live session is the exception: it takes over rather than
                pushes, and Phase 6 owns disabling the back gesture on it. */}
            <Stack.Screen name="live" options={{ animation: 'fade' }} />
          </Stack>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
