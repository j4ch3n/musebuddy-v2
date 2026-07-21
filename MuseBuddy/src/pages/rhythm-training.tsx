import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import {
  PerformanceGuidanceButton,
  PerformanceGuidanceProvider,
  usePerformanceGuidance,
} from '@/components/performance-guidance';
import {
  RhythmViewer,
  useRhythmListenProgress,
  type RhythmPattern,
} from '@/components/rhythm-trainer';
import { museBuddyColors } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import { buildRhythmSoundFontPlaybackConfiguration } from '@/music-theory/sound-font-playback';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

const EMPTY_RHYTHM_PATTERN: RhythmPattern = [];

export function RhythmTrainingPage() {
  const router = useRouter();
  const { learningConfig, session } = useTrainingSession();
  const pattern = session?.rhythm.pattern ?? EMPTY_RHYTHM_PATTERN;
  const stepDurationMs = 0.25 * (60_000 / learningConfig.bpm);
  const allowedOffsetMs = stepDurationMs / 2;
  const listeningDurationMs = pattern.length * stepDurationMs;
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
      listeningMode={{ kind: 'piano-attack', allowedOffsetMs }}
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
      <RhythmTrainingContent
        allowedOffsetMs={allowedOffsetMs}
        listeningDurationMs={listeningDurationMs}
        pattern={pattern}
        stepDurationMs={stepDurationMs}
      />
    </PerformanceGuidanceProvider>
  );
}

function RhythmTrainingContent({
  allowedOffsetMs,
  listeningDurationMs,
  pattern,
  stepDurationMs,
}: {
  allowedOffsetMs: number;
  listeningDurationMs: number;
  pattern: RhythmPattern;
  stepDurationMs: number;
}) {
  const {
    completeListening,
    currentStepIndex: demoStepIndex,
    flowId,
    listeningStartedAtMs,
    phase,
  } = usePerformanceGuidance();
  const {
    attackDots,
    combo,
    currentStepIndex: listeningStepIndex,
  } = useRhythmListenProgress({
    allowedOffsetMs,
    flowId,
    listeningDurationMs,
    listeningStartedAtMs,
    onComplete: completeListening,
    pattern,
    phase,
    stepDurationMs,
  });
  const currentStepIndex = phase === 'listening' ? listeningStepIndex : demoStepIndex;
  const showCombo = phase === 'demo' || phase === 'listening' || phase === 'finish';

  return (
    <TrainingScreenShell
      currentStep="rhythm"
      footer={
        <View style={{ gap: 14 }}>
          {showCombo ? <Text style={styles.combo}>COMBO ×{combo}</Text> : null}
          <PerformanceGuidanceButton />
        </View>
      }
    >
      <RhythmViewer
        attackDots={attackDots}
        currentStepIndex={currentStepIndex}
        pattern={pattern}
        stepDurationMs={stepDurationMs}
      />
    </TrainingScreenShell>
  );
}

const styles = StyleSheet.create({
  combo: {
    color: museBuddyColors.ink,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    lineHeight: 22,
    textAlign: 'center',
  },
});
