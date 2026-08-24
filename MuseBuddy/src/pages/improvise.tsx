import { PianoPatternScore } from '@/components/piano-pattern-score';
import {
  PerformanceGuidanceButton,
  PerformanceGuidanceProvider,
} from '@/components/performance-guidance';
import { useTrainingSession } from '@/contexts/training-session-context';
import { useTrainingSessionTransition } from '@/hooks/use-training-session-transition';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function ImprovisePage() {
  const { session } = useTrainingSession();
  const { advance, skipSection } = useTrainingSessionTransition({
    onScreenChange: () => {},
    screenId: 'improvise',
    sectionId: 'improvise',
  });

  const content = (
    <TrainingScreenShell
      currentStep="freestyle"
      footer={session ? <PerformanceGuidanceButton /> : null}
    >
      {session ? (
        <PianoPatternScore chordChanges={session.scoreChordChanges} score={session.score} />
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
        advance();
      }}
      onSkip={() => {
        skipSection();
      }}
      playback={{ configuration: null, kind: 'silent' }}
    >
      {content}
    </PerformanceGuidanceProvider>
  );
}
