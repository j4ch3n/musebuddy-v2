import { ScrollView, StyleSheet, View } from 'react-native';

import { NoteBarViewer } from './note-bar-viewer';
import { convertRhythmPatternToVexflowBars } from './note-bar-vexflow';
import { getCurrentStepInRhythmBar } from './rhythm-bar-selection';
import { normalizeRhythmPattern, splitRhythmPatternBars } from './rhythm-pattern';
import { RhythmBarViewer } from './rhythm-bar-viewer';
import { RhythmLegend } from './rhythm-legend';
import { RHYTHM_MEASURE_WIDTH_PX } from './constants';
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
  const notationBars = convertRhythmPatternToVexflowBars(normalizedPattern, { clef });

  return (
    <View style={styles.container}>
      {showLegend ? <RhythmLegend /> : null}
      <ScrollView
        accessibilityLabel={`${clef === 'treble' ? 'Treble' : 'Bass'} rhythm timeline`}
        horizontal
        showsHorizontalScrollIndicator
        style={styles.scroll}
      >
        <View style={styles.timeline}>
          {showNotation ? (
            <View style={styles.notationRow}>
              {bars.map((steps, barIndex) => (
                <NoteBarViewer
                  clef={clef}
                  currentStepIndex={getCurrentStepInRhythmBar(currentStepIndex, barIndex)}
                  events={notationBars[barIndex]}
                  key={barIndex}
                  showClefAndTimeSignature={barIndex === 0}
                  steps={steps}
                  width={RHYTHM_MEASURE_WIDTH_PX}
                />
              ))}
            </View>
          ) : null}
          <View style={styles.gridRow}>
            {bars.map((steps, barIndex) => (
              <RhythmBarViewer
                currentStepIndex={getCurrentStepInRhythmBar(currentStepIndex, barIndex)}
                key={barIndex}
                steps={steps}
                width={RHYTHM_MEASURE_WIDTH_PX}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  gridRow: { flexDirection: 'row' },
  notationRow: { flexDirection: 'row' },
  scroll: { flex: 1 },
  timeline: { gap: 6 },
});
