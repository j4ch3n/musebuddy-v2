import { useRouter } from 'expo-router';
import { View } from 'react-native';

import {
  RhythmPlayerControls,
  RhythmViewer,
  useSequencerPlayback,
} from '@/components/rhythm-trainer';
import { useTrainingSession } from '@/contexts/training-session-context';
import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function RhythmTrainingPage() {
  const router = useRouter();
  const { learningConfig, session } = useTrainingSession();
  const pattern = session?.rhythm.pattern ?? [];
  const { currentStepIndex, isPlaying, stopPlayback, togglePlayback } = useSequencerPlayback({
    bpm: learningConfig.bpm,
    pattern,
  });

  return (
    <TrainingScreenShell
      currentStep="rhythm"
      footer={
        <View style={{ gap: 14 }}>
          {pattern.length > 0 && (
            <RhythmPlayerControls isPlaying={isPlaying} onTogglePlayback={togglePlayback} />
          )}
          <Button
            label="Continue"
            onPress={() => {
              stopPlayback();
              router.push('/pattern-training');
            }}
          />
        </View>
      }
    >
      {pattern.length > 0 ? (
        <RhythmViewer currentStepIndex={currentStepIndex} pattern={pattern} />
      ) : (
        <PlaceholderPanel
          accent="blue"
          body="Training material is not loaded yet."
          title="Prepare session"
        />
      )}
    </TrainingScreenShell>
  );
}
