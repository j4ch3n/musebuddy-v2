import { useMemo, useState } from 'react';
import { StyleSheet, type StyleProp, View, type ViewStyle } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { TrainingSessionScore } from '@/contexts/training-session-schema';
import type { ScoreChordChange } from '@/music-theory';
import { Carousel } from '@/ui';

import {
  getActiveScoreMeasureIndex,
  getScorePageIndexForMeasure,
  paginateScore,
} from './piano-pattern-score-layout';
import PianoPatternScoreSheet from './piano-pattern-score-sheet.dom';

export type ScoreTarget =
  | { chordIndex: number; kind: 'chord'; measureIndex: number }
  | { kind: 'rhythm'; measureIndex: number; staff: 'bass' | 'treble' };

type PianoPatternScoreProps = {
  chordChanges: readonly ScoreChordChange[];
  currentStepIndex?: number | null;
  measuresPerPage?: number;
  notationColor?: string;
  renderHeight?: number;
  onTargetPress?: (target: ScoreTarget) => Promise<void>;
  score: TrainingSessionScore;
  style?: StyleProp<ViewStyle>;
  surfaceColor?: string;
  swipeEnabled?: boolean;
};

export function PianoPatternScore({
  chordChanges,
  currentStepIndex = null,
  measuresPerPage,
  notationColor = museBuddyColors.notation,
  renderHeight,
  onTargetPress,
  score,
  style,
  surfaceColor = museBuddyColors.mist,
  swipeEnabled = true,
}: PianoPatternScoreProps) {
  const pages = useMemo(() => paginateScore(score, measuresPerPage), [measuresPerPage, score]);
  const [manualPageIndex, setManualPageIndex] = useState(0);
  const playbackPageIndex = getScorePageIndexForMeasure(
    pages,
    getActiveScoreMeasureIndex(currentStepIndex),
  );
  const selectedPageIndex = playbackPageIndex ?? manualPageIndex;
  return (
    <View style={[styles.pager, style]}>
      <Carousel
        accessibilityLabel="Music score pages"
        getItemAccessibilityLabel={(_, index) => `Score page ${index + 1} of ${pages.length}`}
        indicatorActiveColor={museBuddyColors.wildflower}
        items={pages}
        keyExtractor={(_, index) => `score-page-${index}`}
        onCurrentIndexChange={setManualPageIndex}
        renderItem={(page) => {
          const pageChordChanges = chordChanges.filter((chordChange) =>
            page.measures.some((measure) => measure.index === chordChange.measureIndex),
          );

          return (
            <PianoPatternScorePage
              chordChanges={pageChordChanges}
              currentStepIndex={currentStepIndex}
              notationColor={notationColor}
              renderHeight={renderHeight}
              onTargetPress={onTargetPress}
              score={page}
              surfaceColor={surfaceColor}
            />
          );
        }}
        selectedIndex={selectedPageIndex}
        swipeEnabled={swipeEnabled}
      />
    </View>
  );
}

function PianoPatternScorePage({
  chordChanges,
  currentStepIndex,
  notationColor,
  onTargetPress,
  renderHeight,
  score,
  surfaceColor,
}: {
  chordChanges: readonly ScoreChordChange[];
  currentStepIndex: number | null;
  notationColor: string;
  onTargetPress: ((target: ScoreTarget) => Promise<void>) | undefined;
  renderHeight: number | undefined;
  score: TrainingSessionScore;
  surfaceColor: string;
}) {
  return (
    <View
      accessibilityLabel={`Piano score with ${score.measures.length} measures`}
      style={[styles.score, { backgroundColor: surfaceColor }]}
    >
      <PianoPatternScoreSheet
        chordChanges={chordChanges}
        dom={{
          matchContents: true,
          scrollEnabled: false,
          style: [styles.sheet, { backgroundColor: surfaceColor }],
        }}
        currentStepIndex={currentStepIndex}
        notationColor={notationColor}
        onTargetPress={onTargetPress}
        renderHeight={renderHeight}
        score={score}
        surfaceColor={surfaceColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
    minHeight: 0,
  },
  score: {
    backgroundColor: museBuddyColors.mist,
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  sheet: { width: '100%' },
});
