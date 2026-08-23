import { useRouter } from 'expo-router';

import { PianoPatternScore } from '@/components/piano-pattern-score';
import {
  PerformanceGuidanceButton,
  PerformanceGuidanceProvider,
} from '@/components/performance-guidance';
import { useTrainingSession } from '@/contexts/training-session-context';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function ImprovisePage() {
  const { session } = useTrainingSession();
  const router = useRouter();

  const content = (
    <TrainingScreenShell
      currentStep="freestyle"
      footer={session ? <PerformanceGuidanceButton /> : null}
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

  if (!session) {
    return content;
  }

  return (
    <PerformanceGuidanceProvider
      finishText="Improvise session complete!"
      listeningMode={{ kind: 'none' }}
      onFinish={() => {
        router.push('/congrats');
      }}
      onSkip={() => {
        router.push('/congrats');
      }}
      playback={{ configuration: null, kind: 'silent' }}
    >
      {content}
    </PerformanceGuidanceProvider>
  );
}
