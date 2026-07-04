import { StyleSheet, View } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import { NoteBarViewer } from './note-bar-viewer';
import { splitRhythmPatternBars } from './rhythm-pattern';
import { RhythmBarViewer } from './rhythm-bar-viewer';
import type { RhythmPattern } from './types';

type RhythmViewerProps = {
  currentStepIndex: number | null;
  pattern: RhythmPattern;
};

export function RhythmViewer({ currentStepIndex, pattern }: RhythmViewerProps) {
  const bars = splitRhythmPatternBars(pattern);

  return (
    <View style={styles.container}>
      {bars.map((steps, barIndex) => {
        const barStartIndex = barIndex * steps.length;
        const currentStepInBar =
          currentStepIndex !== null &&
          currentStepIndex >= barStartIndex &&
          currentStepIndex < barStartIndex + steps.length
            ? currentStepIndex - barStartIndex
            : null;
        const isPlayingBar = currentStepInBar !== null;

        return (
          <View key={barIndex} style={styles.barGroup}>
            <RhythmBarViewer
              currentStepIndex={currentStepInBar}
              isPlayingBar={isPlayingBar}
              steps={steps}
            />
            <NoteBarViewer currentStepIndex={currentStepInBar} steps={steps} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  barGroup: {
    backgroundColor: museBuddyColors.surface,
    borderColor: museBuddyColors.ink,
    borderCurve: 'continuous',
    borderRadius: museBuddyRadii.large,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 8px 0 ${museBuddyColors.ink}`,
    gap: 10,
    overflow: 'hidden',
    padding: 12,
  },
});
