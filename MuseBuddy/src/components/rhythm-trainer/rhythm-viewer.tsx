import { StyleSheet, View } from 'react-native';

import { FlashCard } from '@/ui';

import { NoteBarViewer } from './note-bar-viewer';
import { convertRhythmPatternToVexflowBars } from './note-bar-vexflow';
import { normalizeRhythmPattern, splitRhythmPatternBars } from './rhythm-pattern';
import { RhythmBarViewer } from './rhythm-bar-viewer';
import type { RhythmAttackDot, RhythmPattern } from './types';

type RhythmViewerProps = {
  attackDots?: readonly RhythmAttackDot[];
  currentStepIndex: number | null;
  pattern: RhythmPattern;
  stepDurationMs?: number;
};

export function RhythmViewer({
  attackDots = [],
  currentStepIndex,
  pattern,
  stepDurationMs = 1,
}: RhythmViewerProps) {
  const normalizedPattern = normalizeRhythmPattern(pattern);
  const bars = splitRhythmPatternBars(normalizedPattern);
  const notationBars = convertRhythmPatternToVexflowBars(normalizedPattern);

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
                <RhythmBarViewer
                  attackDots={attackDots}
                  barIndex={barIndex}
                  currentStepIndex={currentStepInBar}
                  stepDurationMs={stepDurationMs}
                  steps={steps}
                />
                <NoteBarViewer
                  currentStepIndex={currentStepInBar}
                  events={notationBars[barIndex]}
                  steps={steps}
                />
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
