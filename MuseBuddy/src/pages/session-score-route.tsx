import { StyleSheet, Text, View } from 'react-native';

import { PianoPatternScore } from '@/components/piano-pattern-score';
import type { TrainingSessionRoute } from '@/components/training-session';
import { museBuddyColors } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import { FlashCard } from '@/ui';

import { TrainingSessionShell } from './training-session-shell';

export function SessionScoreRoute({
  activeRoute,
}: {
  activeRoute: Extract<TrainingSessionRoute, 'full-play' | 'preview'>;
}) {
  const { session } = useTrainingSession();

  return (
    <TrainingSessionShell activeRoute={activeRoute}>
      {session ? (
        <View style={styles.cardArea}>
          <FlashCard
            accessibilityLabel={activeRoute === 'preview' ? 'Score preview' : 'Full play score'}
            shadowColor={activeRoute === 'preview' ? museBuddyColors.sky : museBuddyColors.leaf}
            sideA={
              <PianoPatternScore
                chordChanges={session.scoreChordChanges}
                score={session.score}
                surfaceColor={museBuddyColors.paper}
              />
            }
            style={styles.scoreCard}
          />
        </View>
      ) : (
        <SessionUnavailable />
      )}
    </TrainingSessionShell>
  );
}

export function SessionUnavailable() {
  return (
    <View accessibilityRole="alert" style={styles.unavailable}>
      <Text style={styles.unavailableText}>Training material is not ready yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardArea: { flex: 1, minHeight: 0, padding: 12, paddingBottom: 18 },
  scoreCard: { flex: 1 },
  unavailable: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  unavailableText: { color: museBuddyColors.pine, fontSize: 16, fontWeight: '800' },
});
