import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

const prepareTrainingSessionHref = '/prepare-training-session-splash' as Href;

export function WelcomePage() {
  const router = useRouter();

  return (
    <TrainingScreenShell
      eyebrow="Daily exercise"
      footer={
        <Button
          label="Start today's training"
          onPress={() => {
            router.push(prepareTrainingSessionHref);
          }}
        />
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
