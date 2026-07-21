import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { ChoreographyViewer } from '@/components/choreography-viewer';
import {
  PerformanceGuidanceButton,
  PerformanceGuidanceProvider,
} from '@/components/performance-guidance';
import { useTrainingSession } from '@/contexts/training-session-context';
import { buildSoundFontPlaybackConfiguration } from '@/music-theory/sound-font-playback';
import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function SessionGoalPage() {
  const router = useRouter();
  const { learningConfig, prepareTrainingSession, session } = useTrainingSession();
  const playbackConfiguration = useMemo(
    () =>
      session
        ? buildSoundFontPlaybackConfiguration(session.keyArrangement, learningConfig.bpm)
        : null,
    [learningConfig.bpm, session],
  );

  const content = (
    <TrainingScreenShell currentStep="goal" footer={session ? <PerformanceGuidanceButton /> : null}>
      {session ? (
        <ChoreographyViewer keyArrangement={session.keyArrangement} />
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
        router.push('/chord-learning');
      }}
      onSkip={() => {
        router.push('/chord-learning');
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
