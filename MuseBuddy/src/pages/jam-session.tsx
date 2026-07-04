import { useRouter } from 'expo-router';

import {
  PlaceholderPanel,
  PrimaryTrainingButton,
  TrainingScreenShell,
} from './training-screen-shell';

export function JamSessionPage() {
  const router = useRouter();

  return (
    <TrainingScreenShell
      currentStep="jam"
      footer={
        <PrimaryTrainingButton
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
