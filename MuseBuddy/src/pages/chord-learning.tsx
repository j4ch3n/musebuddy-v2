import { useRouter } from 'expo-router';

import { ChordKeyboardCard, ChordNameCard, ChordSheetCard } from '@/components/chord-learning';
import { useTrainingSession } from '@/contexts/training-session-context';
import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function ChordLearningPage() {
  const router = useRouter();
  const { session } = useTrainingSession();

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
      {session ? (
        <>
          <ChordNameCard display={session.chordDisplay} />
          <ChordSheetCard display={session.chordDisplay} />
          <ChordKeyboardCard display={session.chordDisplay} />
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
