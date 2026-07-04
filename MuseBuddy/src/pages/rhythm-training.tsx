import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import {
  generateRandomRhythmPattern,
  RhythmPlayerControls,
  RhythmViewer,
  useSequencerPlayback,
  type RhythmPattern,
} from '@/components/rhythm-trainer';
import { DEFAULT_BPM } from '@/components/rhythm-trainer/constants';
import { dailyTrainingConfig } from '@/training/daily-training-config';

import { PrimaryTrainingButton, TrainingScreenShell } from './training-screen-shell';

export function RhythmTrainingPage() {
  const router = useRouter();
  const [pattern, setPattern] = useState<RhythmPattern>(dailyTrainingConfig.rhythmTraining.pattern);
  const { currentStepIndex, isPlaying, stopPlayback, togglePlayback } = useSequencerPlayback({
    bpm: DEFAULT_BPM,
    pattern,
  });
  const handleRandomPattern = useCallback(() => {
    setPattern(generateRandomRhythmPattern(pattern.length));
  }, [pattern.length]);

  return (
    <TrainingScreenShell
      eyebrow="Step 2 of 3"
      footer={
        <View style={{ gap: 14 }}>
          <RhythmPlayerControls
            isPlaying={isPlaying}
            onRandomPattern={handleRandomPattern}
            onTogglePlayback={togglePlayback}
          />
          <PrimaryTrainingButton
            label="Continue"
            onPress={() => {
              stopPlayback();
              router.push('/jam-session');
            }}
          />
        </View>
      }
      subtitle="Read today's rhythm, then carry it into the jam."
      title="Rhythm training"
    >
      <RhythmViewer currentStepIndex={currentStepIndex} pattern={pattern} />
    </TrainingScreenShell>
  );
}
