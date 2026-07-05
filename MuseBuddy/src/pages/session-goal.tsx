import { useRouter } from 'expo-router';

import { ChoreographyViewer } from '@/components/choreography-viewer';
import { SessionGoalPlayButton } from '@/components/session-goal-play-button';
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
        <>
          <ChoreographyViewer keyArrangement={session.keyArrangement} />
          <SessionGoalPlayButton keyArrangement={session.keyArrangement} />
        </>
      ) : (
        <PlaceholderPanel
          accent="purple"
          body="Load today's training to set a clear practice target before moving into chord and rhythm work."
          title="Today's goal"
        />
      )}
      {!session && <Button label="Load training" onPress={() => void prepareTrainingSession()} />}
    </TrainingScreenShell>
  );
}
