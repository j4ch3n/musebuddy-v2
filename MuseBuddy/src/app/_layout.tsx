import { type ComponentType, useCallback, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';

import tamaguiConfig from '../../tamagui.config';
import { TrainingSessionProvider, useTrainingSession } from '../contexts/training-session-context';
import { LaunchScreen } from '../pages/launch-screen';

type StorybookModule = {
  default: ComponentType;
};

const isStorybookEnabled = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true';

if (!isStorybookEnabled) {
  void SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  if (isStorybookEnabled) {
    // Keep Storybook out of the production bundle unless the Storybook flag is set.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StorybookUIRoot = (require('../../.rnstorybook') as StorybookModule).default;

    return <StorybookUIRoot />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <TrainingSessionProvider>
          <AppContent />
        </TrainingSessionProvider>
        <StatusBar style="dark" />
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { phase } = useTrainingSession();
  const [hasHiddenNativeSplash, setHasHiddenNativeSplash] = useState(false);
  const hideNativeSplash = useCallback(() => {
    if (hasHiddenNativeSplash) return;

    setHasHiddenNativeSplash(true);
    void SplashScreen.hideAsync();
  }, [hasHiddenNativeSplash]);

  if (phase !== 'ready') {
    return <LaunchScreen isRetryPending={phase === 'error'} onLayout={hideNativeSplash} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="training-session" options={{ gestureEnabled: false }} />
      <Stack.Screen name="basic-pitch-debug" />
    </Stack>
  );
}
