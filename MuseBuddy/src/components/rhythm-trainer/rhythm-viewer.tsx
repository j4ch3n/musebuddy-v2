import { StyleSheet, View } from 'react-native';

import { FlashCard } from '@/ui';

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
        return (
          <FlashCard
            key={barIndex}
            padded={false}
            sideA={
              <View style={styles.barGroupContent}>
                <RhythmBarViewer currentStepIndex={currentStepInBar} steps={steps} />
                <NoteBarViewer currentStepIndex={currentStepInBar} steps={steps} />
              </View>
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  barGroupContent: {
    gap: 10,
    padding: 12,
  },
});
