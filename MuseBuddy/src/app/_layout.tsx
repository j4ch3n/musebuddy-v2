import { type ComponentType, useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';

import tamaguiConfig from '../../tamagui.config';
import { TrainingSessionProvider } from '../contexts/training-session-context';

type StorybookModule = {
  default: ComponentType;
};

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
    // Keep Storybook out of the production bundle unless the Storybook flag is set.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StorybookUIRoot = (require('../../.rnstorybook') as StorybookModule).default;

    return <StorybookUIRoot />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            <Stack.Screen name="basic-pitch-debug" />
          </Stack>
        </TrainingSessionProvider>
        <StatusBar style="dark" />
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
