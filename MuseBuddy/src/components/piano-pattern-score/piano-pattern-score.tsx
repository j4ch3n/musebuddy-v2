import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { TrainingSessionScore } from '@/contexts/training-session-schema';
import { Carousel } from '@/ui';

import {
  getActiveScoreMeasureIndex,
  getScorePageIndexForMeasure,
  paginateScore,
} from './piano-pattern-score-layout';
import PianoPatternScoreSheet from './piano-pattern-score-sheet.dom';

type PianoPatternScoreProps = {
  currentStepIndex?: number | null;
  score: TrainingSessionScore;
  swipeEnabled?: boolean;
};

export function PianoPatternScore({
  currentStepIndex = null,
  score,
  swipeEnabled = true,
}: PianoPatternScoreProps) {
  const pages = useMemo(() => paginateScore(score), [score]);
  const [manualPageIndex, setManualPageIndex] = useState(0);
  const playbackPageIndex = getScorePageIndexForMeasure(
    pages,
    getActiveScoreMeasureIndex(currentStepIndex),
  );
  const selectedPageIndex = playbackPageIndex ?? manualPageIndex;

  return (
    <View style={styles.pager}>
      <Carousel
        accessibilityLabel="Music score pages"
        getItemAccessibilityLabel={(_, index) => `Score page ${index + 1} of ${pages.length}`}
        indicatorActiveColor={museBuddyColors.wildflower}
        items={pages}
        keyExtractor={(_, index) => `score-page-${index}`}
        onCurrentIndexChange={setManualPageIndex}
        renderItem={(page) => (
          <PianoPatternScorePage currentStepIndex={currentStepIndex} score={page} />
        )}
        selectedIndex={selectedPageIndex}
        swipeEnabled={swipeEnabled}
      />
    </View>
  );
}

function PianoPatternScorePage({
  currentStepIndex,
  score,
}: {
  currentStepIndex: number | null;
  score: TrainingSessionScore;
}) {
  return (
    <View
      accessibilityLabel={`Piano score with ${score.measures.length} measures`}
      style={styles.score}
    >
      <PianoPatternScoreSheet
        dom={{
          matchContents: true,
          scrollEnabled: false,
          style: styles.sheet,
        }}
        currentStepIndex={currentStepIndex}
        score={score}
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
  sheet: {
    backgroundColor: museBuddyColors.mist,
    width: '100%',
  },
});
