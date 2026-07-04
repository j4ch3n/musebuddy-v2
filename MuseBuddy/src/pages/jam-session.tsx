import { useRouter } from 'expo-router';

import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function JamSessionPage() {
  const router = useRouter();

  return (
    <TrainingScreenShell
      currentStep="jam"
      footer={
        <Button
          label="End session"
          onPress={() => {
            router.push('/congrats');
          }}
        />
      }
    >
      <PlaceholderPanel
        accent="green"
        body="Jam session placeholder. This screen will guide the final improvisation exercise."
        title="Play freely"
      />
    </TrainingScreenShell>
  );
}
