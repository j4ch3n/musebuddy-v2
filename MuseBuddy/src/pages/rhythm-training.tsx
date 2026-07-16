import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import {
  PerformanceGuidanceButton,
  PerformanceGuidanceProvider,
  usePerformanceGuidance,
} from '@/components/performance-guidance';
import { RhythmViewer, type RhythmPattern } from '@/components/rhythm-trainer';
import { useTrainingSession } from '@/contexts/training-session-context';
import { buildRhythmSoundFontPlaybackConfiguration } from '@/music-theory/sound-font-playback';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

const EMPTY_RHYTHM_PATTERN: RhythmPattern = [];

export function RhythmTrainingPage() {
  const router = useRouter();
  const { learningConfig, session } = useTrainingSession();
  const pattern = session?.rhythm.pattern ?? EMPTY_RHYTHM_PATTERN;
  const playbackConfiguration = useMemo(
    () =>
      pattern.length > 0
        ? buildRhythmSoundFontPlaybackConfiguration(pattern, learningConfig.bpm)
        : null,
    [learningConfig.bpm, pattern],
  );

  if (pattern.length === 0) {
    return (
      <TrainingScreenShell currentStep="rhythm" footer={null}>
        <PlaceholderPanel
          accent="blue"
          body="Training material is not loaded yet."
          title="Prepare session"
        />
      </TrainingScreenShell>
    );
  }

  return (
    <PerformanceGuidanceProvider
      demoListenCycleCount={3}
      finishText="this rhythm is fun!"
      key={`rhythm-${pattern.join('')}`}
      onFinish={() => {
        router.push('/pattern-training');
      }}
      onSkip={() => {
        router.push('/pattern-training');
      }}
      playback={{
        configuration: playbackConfiguration,
        kind: 'groove',
      }}
      startPhase="prepare"
    >
      <RhythmTrainingContent pattern={pattern} />
    </PerformanceGuidanceProvider>
  );
}

function RhythmTrainingContent({ pattern }: { pattern: RhythmPattern }) {
  const { completeListening, currentStepIndex, latestDetection, phase } = usePerformanceGuidance();

  useEffect(() => {
    if (phase === 'listening' && latestDetection?.notes.length) {
      void completeListening();
    }
  }, [completeListening, latestDetection, phase]);

  return (
    <TrainingScreenShell
      currentStep="rhythm"
      footer={
        <View style={{ gap: 14 }}>
          <PerformanceGuidanceButton />
        </View>
      }
    >
      <RhythmViewer currentStepIndex={currentStepIndex} pattern={pattern} />
    </TrainingScreenShell>
  );
}
