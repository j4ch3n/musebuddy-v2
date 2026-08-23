import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';

import { NoteBarViewer } from './note-bar-viewer';
import { RhythmAttackDebugIndicator } from './rhythm-attack-debug-indicator';
import { convertRhythmPatternToVexflowBars } from './note-bar-vexflow';
import { normalizeRhythmPattern, splitRhythmPatternBars } from './rhythm-pattern';
import { RhythmBarViewer } from './rhythm-bar-viewer';
import { RhythmLegend } from './rhythm-legend';
import type { RhythmAttackDot, RhythmPattern } from './types';

type RhythmViewerProps = {
  attackDots?: readonly RhythmAttackDot[];
  attackFlashId?: number;
  currentStepIndex: number | null;
  pattern: RhythmPattern;
  previewPattern?: RhythmPattern;
  stepDurationMs?: number;
};

export function RhythmViewer({
  attackDots = [],
  attackFlashId = 0,
  currentStepIndex,
  pattern,
  previewPattern = [],
  stepDurationMs = 1,
}: RhythmViewerProps) {
  const normalizedPattern = normalizeRhythmPattern(pattern);
  const bars = splitRhythmPatternBars(normalizedPattern);
  const notationBars = convertRhythmPatternToVexflowBars(normalizedPattern);
  const previewBars = splitRhythmPatternBars(normalizeRhythmPattern(previewPattern));
  const previewNotationBars = convertRhythmPatternToVexflowBars(
    normalizeRhythmPattern(previewPattern),
  );

  return (
    <View style={styles.container}>
      <RhythmAttackDebugIndicator flashId={attackFlashId} />
      <RhythmLegend />
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
              <NoteBarViewer
                currentStepIndex={currentStepInBar}
                events={notationBars[barIndex]}
                steps={steps}
              />
              <RhythmBarViewer
                attackDots={attackDots}
                barIndex={barIndex}
                currentStepIndex={currentStepInBar}
                stepDurationMs={stepDurationMs}
                steps={steps}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.preview}>
        {previewNotationBars.length > 0 ? (
          <>
            <Text style={styles.previewLabel}>NEXT</Text>
            {previewNotationBars.map((events, barIndex) => (
              <NoteBarViewer
                currentStepIndex={null}
                events={events}
                key={barIndex}
                steps={previewBars[barIndex]!}
              />
            ))}
          </>
        ) : (
          <Text style={styles.completionLabel}>Final section — keep the groove going.</Text>
        )}
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
  preview: {
    borderTopColor: museBuddyColors.pine,
    borderTopWidth: 2,
    gap: 4,
    marginTop: 8,
    minHeight: 82,
    paddingTop: 10,
  },
  previewLabel: {
    color: museBuddyColors.pine,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  completionLabel: {
    color: museBuddyColors.pine,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
});
