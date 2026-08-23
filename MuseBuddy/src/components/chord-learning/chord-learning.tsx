import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import { usePerformanceGuidance } from '@/components/performance-guidance';
import type { ChordDisplay } from '@/music-theory';

import { ChordKeyboardCard } from './chord-keyboard-card';
import { getChordLearningCueVisibility } from './chord-learning-cue-visibility';
import { ChordName } from './chord-name';
import { useChordListenRecognition } from './use-chord-listen-recognition';

type ChordLearningProps = {
  display: ChordDisplay;
  isActive: boolean;
};

export function ChordLearning({ display, isActive }: ChordLearningProps) {
  const displays = useMemo(() => [display], [display]);
  const { completedCycles } = usePerformanceGuidance();
  const { errorMessage, liveKeys } = useChordListenRecognition({ displays, enabled: isActive });
  const cueVisibility = getChordLearningCueVisibility(completedCycles);

  return (
    <View style={styles.container}>
      <Text accessibilityLabel={`Chord name ${display.friendlyName}`} style={styles.friendlyName}>
        {display.friendlyName}
      </Text>
      <View style={styles.learningContent}>
        <ChordName display={display} size="large" />
        <ChordKeyboardCard
          display={display}
          errorMessage={errorMessage}
          liveKeys={liveKeys}
          showKeyHighlightDots={cueVisibility.showKeyHighlightDots}
          showSheetNotation={cueVisibility.showSheetNotation}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
  },
  learningContent: {
    alignItems: 'stretch',
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  friendlyName: {
    color: museBuddyColors.pine,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    textAlign: 'left',
  },
});
