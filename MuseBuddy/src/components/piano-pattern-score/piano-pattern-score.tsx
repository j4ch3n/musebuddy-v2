import { StyleSheet, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { TrainingSessionScore } from '@/contexts/training-session-schema';
import { GraphicSheet } from '@/ui';

import PianoPatternScoreSheet from './piano-pattern-score-sheet.dom';

type PianoPatternScoreProps = {
  score: TrainingSessionScore;
};

export function PianoPatternScore({ score }: PianoPatternScoreProps) {
  return (
    <GraphicSheet tone="mist">
      <View
        accessibilityLabel={`Piano score with ${score.measures.length} measures`}
        style={styles.score}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.focusMarker}
        />
        <PianoPatternScoreSheet
          dom={{
            matchContents: true,
            scrollEnabled: false,
            style: styles.sheet,
          }}
          score={score}
        />
      </View>
    </GraphicSheet>
  );
}

const styles = StyleSheet.create({
  score: {
    backgroundColor: museBuddyColors.mist,
    overflow: 'hidden',
    width: '100%',
  },
  focusMarker: {
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.frame,
    borderRadius: 5,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 12,
    top: 12,
    width: 10,
    zIndex: 1,
  },
  sheet: {
    backgroundColor: museBuddyColors.mist,
    width: '100%',
  },
});
