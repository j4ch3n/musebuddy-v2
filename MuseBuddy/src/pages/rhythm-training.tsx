import { useMemo } from 'react';

import {
  PerformanceGuidanceButton,
  PerformanceGuidanceProvider,
  usePerformanceGuidance,
} from '@/components/performance-guidance';
import {
  RhythmViewer,
  splitRhythmPatternChunks,
  useRhythmListenProgress,
  type RhythmPattern,
} from '@/components/rhythm-trainer';
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
  const chunks = useMemo(() => splitRhythmPatternChunks(pattern), [pattern]);
  const playbackConfigurations = useMemo(
    () =>
      chunks.map((chunk) => buildRhythmSoundFontPlaybackConfiguration(chunk, learningConfig.bpm)),
    [chunks, learningConfig.bpm],
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
      cycleCount={1}
      finishText={`${staff === 'treble' ? 'Treble' : 'Bass'} rhythm is fun!`}
      getPrimaryButtonLabel={({ isRetryingCurrentSegment, phase }) =>
        isRetryingCurrentSegment ? 'Try again' : phase === 'pending' ? 'Start' : 'Pause'
      }
      key={`rhythm-${staff}-${pattern.join('')}`}
      listeningMode={{ kind: 'piano-attack', allowedOffsetMs }}
      onFinish={() => {
        advance();
      }}
      onSkip={() => {
        skipSection();
      }}
      playback={{
        configuration: playbackConfigurations[0] ?? null,
        kind: 'groove',
      }}
      segmentConfigurations={playbackConfigurations}
      startPhase={training ? 'prepare' : 'pending'}
    >
      <RhythmTrainingContent
        allowedOffsetMs={allowedOffsetMs}
        chunks={chunks}
        staff={staff}
        stepDurationMs={stepDurationMs}
      />
    </PerformanceGuidanceProvider>
  );
}

function RhythmTrainingContent({
  allowedOffsetMs,
  chunks,
  staff,
  stepDurationMs,
}: {
  allowedOffsetMs: number;
  chunks: readonly RhythmPattern[];
  staff: RhythmStaff;
  stepDurationMs: number;
}) {
  const {
    completeListening,
    currentSegmentIndex,
    currentStepIndex: demoStepIndex,
    flowId,
    listeningStartedAtMs,
    phase,
  } = usePerformanceGuidance();
  const pattern = chunks[currentSegmentIndex] ?? EMPTY_RHYTHM_PATTERN;
  const previewPattern = chunks[currentSegmentIndex + 1] ?? EMPTY_RHYTHM_PATTERN;
  const listeningDurationMs = pattern.length * stepDurationMs;
  const { attackDots, currentStepIndex: listeningStepIndex } = useRhythmListenProgress({
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

  return (
    <TrainingScreenShell
      currentStep={staff === 'bass' ? 'rhythm-bass' : 'rhythm-treble'}
      footer={<PerformanceGuidanceButton />}
    >
      <RhythmViewer
        attackDots={attackDots}
        currentStepIndex={currentStepIndex}
        pattern={pattern}
        previewPattern={previewPattern}
        stepDurationMs={stepDurationMs}
      />
    </TrainingScreenShell>
  );
}
