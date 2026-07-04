import { useRouter } from 'expo-router';

import { RhythmViewer } from '@/components/rhythm-trainer';
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
      {session ? (
        <RhythmViewer currentStepIndex={null} pattern={session.rhythm.pattern} />
      ) : (
        <PlaceholderPanel
          accent="blue"
          body="Training material is not loaded yet."
          title="Prepare session"
        />
      )}
      {!session && <Button label="Load training" onPress={() => void prepareTrainingSession()} />}
    </TrainingScreenShell>
  );
}
