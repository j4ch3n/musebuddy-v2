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
        body="Preview today's pattern, learn its chords, train each hand's rhythm, then review the full score."
        title="Practice path"
      />
    </TrainingScreenShell>
  );
}
