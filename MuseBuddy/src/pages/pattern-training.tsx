import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { PianoPatternScore } from '@/components/piano-pattern-score';
import {
  PerformanceGuidanceButton,
  PerformanceGuidanceProvider,
  usePerformanceGuidance,
} from '@/components/performance-guidance';
import { useTrainingSession } from '@/contexts/training-session-context';
import { buildPatternSoundFontPlaybackConfiguration } from '@/music-theory/sound-font-playback';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function PatternTrainingPage() {
  const router = useRouter();
  const { learningConfig, session } = useTrainingSession();
  const playbackConfiguration = useMemo(
    () =>
      session
        ? buildPatternSoundFontPlaybackConfiguration(session.notes, learningConfig.bpm)
        : null,
    [learningConfig.bpm, session],
  );

  const content = (
    <TrainingScreenShell
      currentStep="pattern"
      footer={session ? <PerformanceGuidanceButton /> : null}
    >
      {session ? (
        <GuidedPianoPatternScore score={session.score} />
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
      cycleCount={2}
      finishText="Full score complete!"
      listeningMode={{ kind: 'none' }}
      onFinish={() => {
        router.push('/congrats');
      }}
      onSkip={() => {
        router.push('/congrats');
      }}
      playback={{
        configuration: playbackConfiguration,
        kind: 'piano',
      }}
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
