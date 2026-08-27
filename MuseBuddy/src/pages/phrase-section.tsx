import { StyleSheet, View } from 'react-native';

import { PianoPatternScore } from '@/components/piano-pattern-score';
import { museBuddyColors } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import { PhraseStageCard } from '@/components/phrase-stage-card';

import { SessionUnavailable } from './session-score-route';
import { TrainingSessionShell } from './training-session-shell';

const PHRASE_SHEET_SLOT_HEIGHT = 180;

export function PhraseSection() {
  const {
    learningConfig,
    selectedPhraseIndex,
    selectedPhraseStage,
    session,
    setSelectedPhraseStage,
  } = useTrainingSession();
  const bars = session?.bars ?? [];
  const phraseIndex = Math.min(selectedPhraseIndex, Math.max(bars.length - 1, 0));
  const currentBar = bars[phraseIndex];

  return (
    <TrainingSessionShell activeRoute="phrase">
      {currentBar && session ? (
        <View style={styles.content}>
          <View accessibilityLabel="Current phrase notation" style={styles.sheetSlot}>
            <PianoPatternScore
              chordChanges={currentBar.chordChanges}
              notationColor={museBuddyColors.notation}
              renderHeight={PHRASE_SHEET_SLOT_HEIGHT}
              score={currentBar.score}
              style={styles.phraseScore}
              surfaceColor={museBuddyColors.mist}
              swipeEnabled={false}
            />
          </View>
          <PhraseStageCard
            bar={currentBar}
            bpm={learningConfig.bpm}
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

const styles = StyleSheet.create({
  content: { flex: 1, gap: 12, minHeight: 0, padding: 12, paddingBottom: 18 },
  phraseScore: { height: PHRASE_SHEET_SLOT_HEIGHT, width: '100%' },
  sheetSlot: {
    alignItems: 'center',
    height: PHRASE_SHEET_SLOT_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
