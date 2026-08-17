import { useRouter } from 'expo-router';
import { PianoPatternScore } from '@/components/piano-pattern-score';
import { useTrainingSession } from '@/contexts/training-session-context';
import { Button, TrainingControlDeck } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function PatternTrainingPage() {
  const router = useRouter();
  const { session } = useTrainingSession();

  return (
    <TrainingScreenShell
      currentStep="pattern"
      footer={
        <TrainingControlDeck
          primary={
            <Button
              label="Finish"
              onPress={() => {
                router.push('/congrats');
              }}
            />
          }
          utility={<Button disabled label="Play" onPress={() => {}} primary={false} />}
        />
      }
    >
      {session ? (
        <PianoPatternScore score={session.score} />
      ) : (
        <PlaceholderPanel
          accent="wildflower"
          body="Training material is not loaded yet."
          title="Prepare session"
        />
      )}
    </TrainingScreenShell>
  );
}
