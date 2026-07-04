import { useRouter } from 'expo-router';

import {
  buildChordDisplay,
  ChordKeyboardCard,
  ChordNameCard,
  ChordSheetCard,
} from '@/components/chord-learning';
import { useTrainingSession } from '@/contexts/training-session-context';
import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function ChordLearningPage() {
  const router = useRouter();
  const { session } = useTrainingSession();
  const display = session ? buildChordDisplay(session.chord) : null;

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
      {display ? (
        <>
          <ChordNameCard display={display} />
          <ChordSheetCard display={display} />
          <ChordKeyboardCard display={display} />
        </>
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
