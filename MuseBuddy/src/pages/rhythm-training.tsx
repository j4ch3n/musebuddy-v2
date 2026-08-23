import { useMemo } from 'react';
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
import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import { useTrainingSessionTransition } from '@/hooks/use-training-session-transition';
import { buildRhythmSoundFontPlaybackConfiguration } from '@/music-theory/sound-font-playback';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

const EMPTY_RHYTHM_PATTERN: RhythmPattern = [];
type RhythmStaff = 'bass' | 'treble';

type RhythmTrainingPageProps = {
  staff: RhythmStaff;
};

export function RhythmTrainingPage({ staff }: RhythmTrainingPageProps) {
  const { learningConfig, session, training } = useTrainingSession();
  const sectionId = staff === 'bass' ? 'rhythm-bass' : 'rhythm-treble';
  const { advance, skipSection } = useTrainingSessionTransition({
    onScreenChange: () => {},
    screenId: sectionId,
    sectionId,
  });
  const pattern = session?.rhythms[staff].pattern ?? EMPTY_RHYTHM_PATTERN;
  const currentStep = staff === 'bass' ? 'rhythm-bass' : 'rhythm-treble';
  const stepDurationMs = 0.125 * (60_000 / learningConfig.bpm);
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
      <TrainingScreenShell currentStep={currentStep} footer={null}>
        <PlaceholderPanel
          accent="wildflower"
          body="Training material is not loaded yet."
          title="Prepare session"
        />
      </TrainingScreenShell>
    );
  }

  return (
    <PerformanceGuidanceProvider
      demoListenCycleCount={3}
      finishText={`${staff === 'treble' ? 'Treble' : 'Bass'} rhythm is fun!`}
      key={`rhythm-${staff}-${pattern.join('')}`}
      listeningMode={{ kind: 'piano-attack', allowedOffsetMs }}
      onFinish={() => {
        advance();
      }}
      onSkip={() => {
        skipSection();
      }}
      playback={{
        configuration: playbackConfiguration,
        kind: 'groove',
      }}
      startPhase={training ? 'prepare' : 'pending'}
    >
      <RhythmTrainingContent
        allowedOffsetMs={allowedOffsetMs}
        listeningDurationMs={listeningDurationMs}
        pattern={pattern}
        staff={staff}
        stepDurationMs={stepDurationMs}
      />
    </PerformanceGuidanceProvider>
  );
}

function RhythmTrainingContent({
  allowedOffsetMs,
  listeningDurationMs,
  pattern,
  staff,
  stepDurationMs,
}: {
  allowedOffsetMs: number;
  listeningDurationMs: number;
  pattern: RhythmPattern;
  staff: RhythmStaff;
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
      currentStep={staff === 'bass' ? 'rhythm-bass' : 'rhythm-treble'}
      footer={
        <View style={{ gap: 14 }}>
          {showCombo ? (
            <View style={styles.comboPill}>
              <Text style={styles.combo}>COMBO ×{combo}</Text>
            </View>
          ) : null}
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
    color: museBuddyColors.pine,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    lineHeight: 22,
    textAlign: 'center',
  },
  comboPill: {
    alignSelf: 'center',
    backgroundColor: museBuddyColors.leaf,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.round,
    borderWidth: 2,
    boxShadow: `4px 4px 0 ${museBuddyColors.sky}`,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
});
