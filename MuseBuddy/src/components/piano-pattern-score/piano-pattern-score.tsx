import { StyleSheet, View } from 'react-native';

import type { TrainingSessionScore } from '@/contexts/training-session-schema';
import { FlashCard } from '@/ui';

import PianoPatternScoreSheet from './piano-pattern-score-sheet.dom';

type PianoPatternScoreProps = {
  score: TrainingSessionScore;
};

export function PianoPatternScore({ score }: PianoPatternScoreProps) {
  return (
    <FlashCard
      accessibilityLabel={`Piano score with ${score.measures.length} measures`}
      padded={false}
      sideA={
        <View style={styles.score}>
          <PianoPatternScoreSheet
            dom={{
              matchContents: true,
              scrollEnabled: false,
              style: styles.sheet,
            }}
            score={score}
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  score: {
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    width: '100%',
  },
  sheet: {
    backgroundColor: 'transparent',
    width: '100%',
  },
});
