import { StyleSheet, View } from 'react-native';

import { NoteBarViewer } from './note-bar-viewer';
import { convertRhythmPatternToVexflowBars } from './note-bar-vexflow';
import { normalizeRhythmPattern, splitRhythmPatternBars } from './rhythm-pattern';
import { RhythmBarViewer } from './rhythm-bar-viewer';
import { RhythmLegend } from './rhythm-legend';
import type { RhythmPattern } from './types';

type RhythmViewerProps = {
  clef?: 'bass' | 'treble';
  currentStepIndex: number | null;
  pattern: RhythmPattern;
  showLegend?: boolean;
  showNotation?: boolean;
};

export function RhythmViewer({
  clef = 'treble',
  currentStepIndex,
  pattern,
  showLegend = true,
  showNotation = true,
}: RhythmViewerProps) {
  const normalizedPattern = normalizeRhythmPattern(pattern);
  const bars = splitRhythmPatternBars(normalizedPattern);
  const notationBars = convertRhythmPatternToVexflowBars(normalizedPattern);

  return (
    <View style={styles.container}>
      {showLegend ? <RhythmLegend /> : null}
      <View style={styles.currentBars}>
        {bars.map((steps, barIndex) => {
          const barStartIndex = barIndex * steps.length;
          const currentStepInBar =
            currentStepIndex !== null &&
            currentStepIndex >= barStartIndex &&
            currentStepIndex < barStartIndex + steps.length
              ? currentStepIndex - barStartIndex
              : null;

          return (
            <View key={barIndex} style={styles.barGroup}>
              {showNotation ? (
                <NoteBarViewer
                  clef={clef}
                  currentStepIndex={currentStepInBar}
                  events={notationBars[barIndex]}
                  steps={steps}
                />
              ) : null}
              <RhythmBarViewer currentStepIndex={currentStepInBar} steps={steps} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
    paddingTop: 4,
  },
  currentBars: {
    gap: 10,
  },
  barGroup: { gap: 8 },
});
