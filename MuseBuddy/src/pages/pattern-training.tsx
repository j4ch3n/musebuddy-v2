import { useRouter } from 'expo-router';

import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function PatternTrainingPage() {
  const router = useRouter();

  return (
    <TrainingScreenShell
      currentStep="pattern"
      footer={
        <Button
          label="Continue"
          onPress={() => {
            router.push('/jam-session');
          }}
        />
      }
    >
      <PlaceholderPanel
        accent="purple"
        body="Pattern placeholder. This screen will turn the chord and rhythm into a reusable piano shape."
        title="Shape the pattern"
      />
    </TrainingScreenShell>
  );
}
