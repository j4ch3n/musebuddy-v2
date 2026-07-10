import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { YStack } from 'tamagui';

import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

const prepareTrainingSessionHref = '/prepare-training-session-splash' as Href;
const basicPitchDebugHref = '/basic-pitch-debug' as Href;

export function WelcomePage() {
  const router = useRouter();

  return (
    <TrainingScreenShell
      eyebrow="Daily exercise"
      footer={
        <YStack gap="$3">
          <Button
            label="Start today's training"
            onPress={() => {
              router.push(prepareTrainingSessionHref);
            }}
          />
          <Button
            label="Basic Pitch debug"
            onPress={() => {
              router.push(basicPitchDebugHref);
            }}
            primary={false}
          />
        </YStack>
      }
      subtitle="A focused piano improvisation practice session for today."
      title="MuseBuddy"
    >
      <PlaceholderPanel
        accent="purple"
        body="Warm up with today's chord shape, lock in the rhythm, then use both ideas in a short jam."
        title="Practice path"
      />
    </TrainingScreenShell>
  );
}
