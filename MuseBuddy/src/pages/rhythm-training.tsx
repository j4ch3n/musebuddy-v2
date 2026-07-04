import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import {
  RhythmPlayerControls,
  RhythmSpeedControl,
  RhythmViewer,
  useSequencerPlayback,
} from '@/components/rhythm-trainer';
import { DEFAULT_BPM } from '@/components/rhythm-trainer/constants';
import { useTrainingSession } from '@/contexts/training-session-context';
import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function RhythmTrainingPage() {
  const router = useRouter();
  const { session } = useTrainingSession();
  const pattern = session?.rhythm.pattern ?? [];
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const { currentStepIndex, isPlaying, stopPlayback, togglePlayback } = useSequencerPlayback({
    bpm,
    pattern,
  });

  return (
    <TrainingScreenShell
      currentStep="rhythm"
      footer={
        <View style={{ gap: 14 }}>
          {pattern.length > 0 && (
            <>
              <RhythmSpeedControl onChange={setBpm} value={bpm} />
              <RhythmPlayerControls isPlaying={isPlaying} onTogglePlayback={togglePlayback} />
            </>
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
