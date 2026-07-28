import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { PianoPatternScore } from '@/components/piano-pattern-score';
import { useTrainingSession } from '@/contexts/training-session-context';
import { Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function PatternTrainingPage() {
  const router = useRouter();
  const { session } = useTrainingSession();

  return (
    <TrainingScreenShell
      currentStep="pattern"
      footer={
        <View style={{ gap: 14 }}>
          <Button disabled label="Play · coming soon" onPress={() => {}} primary={false} />
          <Button
            label="Finish practice"
            onPress={() => {
              router.push('/congrats');
            }}
            tone="success"
          />
        </View>
      }
    >
      {session ? (
        <PianoPatternScore score={session.score} />
      ) : (
        <PlaceholderPanel
          accent="purple"
          body="Training material is not loaded yet."
          title="Prepare session"
        />
      )}
    </TrainingScreenShell>
  );
}
