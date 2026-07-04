import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider } from 'tamagui';

import StorybookUIRoot from '../../.rnstorybook';
import tamaguiConfig from '../../tamagui.config';
import { TrainingSessionProvider } from '../contexts/training-session-context';

const isStorybookEnabled = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true';

if (!isStorybookEnabled) {
  void SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  useEffect(() => {
    if (!isStorybookEnabled) {
      void SplashScreen.hideAsync();
    }
  }, []);

  if (isStorybookEnabled) {
    return <StorybookUIRoot />;
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <TrainingSessionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="prepare-training-session-splash"
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="session-goal" options={{ gestureEnabled: false }} />
          <Stack.Screen name="chord-learning" options={{ gestureEnabled: false }} />
          <Stack.Screen name="rhythm-training" options={{ gestureEnabled: false }} />
          <Stack.Screen name="pattern-training" options={{ gestureEnabled: false }} />
          <Stack.Screen name="jam-session" options={{ gestureEnabled: false }} />
        </Stack>
      </TrainingSessionProvider>
      <StatusBar style="dark" />
    </TamaguiProvider>
  );
}
