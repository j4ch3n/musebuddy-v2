import { useRouter } from 'expo-router';

import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function SessionGoalPage() {
  const router = useRouter();

  return (
    <TrainingScreenShell
      currentStep="goal"
      footer={
        <Button
          label="Continue"
          onPress={() => {
            router.push('/chord-learning');
          }}
        />
      }
    >
      <PlaceholderPanel
        accent="blue"
        body="Goal placeholder. This screen will set the focus for today's practice."
        title="Set your goal"
      />
    </TrainingScreenShell>
  );
}
