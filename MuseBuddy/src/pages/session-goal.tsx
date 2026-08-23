import { useMemo } from 'react';

import { PianoPatternScore } from '@/components/piano-pattern-score';
import {
  PerformanceGuidanceButton,
  PerformanceGuidanceProvider,
  usePerformanceGuidance,
} from '@/components/performance-guidance';
import { useTrainingSession } from '@/contexts/training-session-context';
import { useTrainingSessionTransition } from '@/hooks/use-training-session-transition';
import { buildPatternSoundFontPlaybackConfiguration } from '@/music-theory/sound-font-playback';
import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function SessionGoalPage() {
  const { learningConfig, prepareTrainingSession, session, training } = useTrainingSession();
  const { advance, skipSection } = useTrainingSessionTransition({
    onScreenChange: () => {},
    screenId: 'goal',
    sectionId: 'goal',
  });
  const playbackConfiguration = useMemo(
    () =>
      session
        ? buildPatternSoundFontPlaybackConfiguration(session.notes, learningConfig.bpm)
        : null,
    [learningConfig.bpm, session],
  );

  const content = (
    <TrainingScreenShell currentStep="goal" footer={session ? <PerformanceGuidanceButton /> : null}>
      {session ? (
        <GuidedPianoPatternScore score={session.score} />
      ) : (
        <PlaceholderPanel
          accent="wildflower"
          body="Load today's training to set a clear practice target before moving into chord and rhythm work."
          title="Today's goal"
        />
      )}
      {!session && <Button label="Load training" onPress={() => void prepareTrainingSession()} />}
    </TrainingScreenShell>
  );

  if (!session) {
    return content;
  }

  return (
    <PerformanceGuidanceProvider
      cycleCount={2}
      finishText="I'm excited, let's go!"
      key="session-goal"
      listeningMode={{ kind: 'none' }}
      onFinish={() => {
        advance();
      }}
      onSkip={() => {
        skipSection();
      }}
      playback={{
        configuration: playbackConfiguration,
        kind: 'piano',
      }}
      startPhase={training ? 'prepare' : 'pending'}
    >
      {content}
    </PerformanceGuidanceProvider>
  );
}

function GuidedPianoPatternScore({
  score,
}: {
  score: NonNullable<ReturnType<typeof useTrainingSession>['session']>['score'];
}) {
  const { currentStepIndex, phase } = usePerformanceGuidance();

  return (
    <PianoPatternScore
      currentStepIndex={currentStepIndex}
      score={score}
      swipeEnabled={phase === 'pending'}
    />
  );
}
