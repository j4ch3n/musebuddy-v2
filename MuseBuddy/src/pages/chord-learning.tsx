import { useRouter } from 'expo-router';

import {
  buildChordDisplay,
  ChordKeyboardCard,
  ChordNameCard,
  ChordSheetCard,
} from '@/components/chord-learning';
import { dailyTrainingConfig } from '@/training/daily-training-config';
import { Button } from '@/ui';

import { TrainingScreenShell } from './training-screen-shell';

export function ChordLearningPage() {
  const router = useRouter();
  const chord = dailyTrainingConfig.chordLearning.chord;
  const display = buildChordDisplay(chord);

  return (
    <TrainingScreenShell
      currentStep="chord"
      footer={
        <Button
          label="Continue"
          onPress={() => {
            router.push('/rhythm-training');
          }}
        />
      }
    >
      <ChordNameCard display={display} explanation={chord.explanation} />
      <ChordSheetCard display={display} />
      <ChordKeyboardCard display={display} />
    </TrainingScreenShell>
  );
}
