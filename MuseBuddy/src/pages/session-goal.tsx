import { useRouter } from 'expo-router';

import { useTrainingSession } from '@/contexts/training-session-context';
import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function SessionGoalPage() {
  const router = useRouter();
  const { prepareTrainingSession, session } = useTrainingSession();

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
        accent="purple"
        body={
          session
            ? "Today, you'll set a clear practice target before moving into chord and rhythm training."
            : "Load today's training to set a clear practice target before moving into chord and rhythm work."
        }
        title="Today's goal"
      />
      {!session && <Button label="Load training" onPress={() => void prepareTrainingSession()} />}
    </TrainingScreenShell>
  );
}
