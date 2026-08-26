import Lucide from '@react-native-vector-icons/lucide';
import { StyleSheet, Text, View } from 'react-native';

import { PianoPatternScore } from '@/components/piano-pattern-score';
import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import { PhraseStageCard } from '@/components/phrase-stage-card';

import { SessionUnavailable } from './session-score-route';
import { TrainingSessionShell } from './training-session-shell';

const PHRASE_SHEET_SLOT_HEIGHT = 180;

export function PhraseSection() {
  const { selectedPhraseIndex, selectedPhraseStage, session, setSelectedPhraseStage } =
    useTrainingSession();
  const bars = session?.bars ?? [];
  const phraseIndex = Math.min(selectedPhraseIndex, Math.max(bars.length - 1, 0));
  const currentBar = bars[phraseIndex];
  const previousBar = phraseIndex > 0 ? bars[phraseIndex - 1] : null;

  return (
    <TrainingSessionShell activeRoute="phrase">
      {currentBar && session ? (
        <View style={styles.content}>
          <View
            accessibilityLabel="Current and previous phrase notation"
            style={styles.sheetPreview}
          >
            <PhraseSheetSlot bar={previousBar} notationColor={museBuddyColors.notationGray} />
            <PhraseSheetSlot bar={currentBar} notationColor={museBuddyColors.notation} />
          </View>
          <PhraseStageCard
            onStageChange={setSelectedPhraseStage}
            selectedStage={selectedPhraseStage}
          />
        </View>
      ) : (
        <SessionUnavailable />
      )}
    </TrainingSessionShell>
  );
}

function PhraseSheetSlot({
  bar,
  notationColor,
}: {
  bar: NonNullable<ReturnType<typeof useTrainingSession>['session']>['bars'][number] | null;
  notationColor: string;
}) {
  return (
    <View
      accessibilityLabel={bar ? undefined : 'No previous bar'}
      style={[styles.sheetSlot, !bar && styles.emptySheetSlot]}
    >
      {bar ? (
        <PianoPatternScore
          chordChanges={bar.chordChanges}
          notationColor={notationColor}
          renderHeight={PHRASE_SHEET_SLOT_HEIGHT}
          score={bar.score}
          style={styles.phraseScore}
          surfaceColor={museBuddyColors.mist}
          swipeEnabled={false}
        />
      ) : (
        <View style={styles.emptySheetContent}>
          <Lucide color={museBuddyColors.pine} name="music" size={22} />
          <View style={styles.emptySheetCopy}>
            <Text style={styles.emptySheetTitle}>First bar</Text>
            <Text style={styles.emptySheetMessage}>No previous sheet</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: 12, minHeight: 0, padding: 12, paddingBottom: 18 },
  emptySheetContent: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  emptySheetCopy: { gap: 1 },
  emptySheetMessage: { color: museBuddyColors.pine, fontSize: 13, fontWeight: '600' },
  emptySheetSlot: {
    backgroundColor: museBuddyColors.secondaryFace,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderStyle: 'dashed',
    borderWidth: museBuddyBorders.standard,
  },
  emptySheetTitle: { color: museBuddyColors.pine, fontSize: 15, fontWeight: '900' },
  phraseScore: { height: PHRASE_SHEET_SLOT_HEIGHT, width: '100%' },
  sheetPreview: { gap: 4 },
  sheetSlot: {
    alignItems: 'center',
    height: PHRASE_SHEET_SLOT_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
