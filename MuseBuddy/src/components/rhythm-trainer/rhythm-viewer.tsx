import { StyleSheet, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';

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
      <View
        accessibilityLabel={`${clef === 'treble' ? 'Treble' : 'Bass'} rhythm timeline`}
        style={styles.timeline}
      >
        {bars.map((steps, barIndex) => (
          <View key={barIndex} style={styles.beatRow}>
            {showNotation ? (
              <NoteBarViewer
                clef={clef}
                currentStepIndex={getCurrentStepInRhythmBar(currentStepIndex, barIndex)}
                events={notationBars[barIndex]}
                showClefAndTimeSignature={barIndex === 0}
                steps={steps}
                surfaceColor={museBuddyColors.paper}
                width={RHYTHM_MEASURE_WIDTH_PX}
              />
            ) : null}
            <RhythmBarViewer
              currentStepIndex={getCurrentStepInRhythmBar(currentStepIndex, barIndex)}
              steps={steps}
              width={RHYTHM_MEASURE_WIDTH_PX}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  beatRow: { gap: 4 },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  timeline: { gap: 8 },
});
