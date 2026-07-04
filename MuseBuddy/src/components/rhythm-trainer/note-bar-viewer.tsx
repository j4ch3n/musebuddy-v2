import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import NoteBarSheet from './note-bar-sheet.dom';
import { convertRhythmBarToVexflowEvents } from './note-bar-vexflow';
import type { RhythmStep } from './types';
import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

type NoteBarViewerProps = {
  currentStepIndex: number | null;
  steps: readonly RhythmStep[];
};

export function NoteBarViewer({ currentStepIndex, steps }: NoteBarViewerProps) {
  const events = useMemo(() => convertRhythmBarToVexflowEvents(steps), [steps]);

  return (
    <View accessibilityLabel="Note preview for rhythm bar" style={styles.container}>
      <NoteBarSheet
        currentStepIndex={currentStepIndex}
        dom={{
          scrollEnabled: false,
          style: styles.sheet,
        }}
        events={events}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: museBuddyColors.white,
    borderRadius: museBuddyRadii.medium,
    height: 124,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheet: {
    backgroundColor: 'transparent',
    height: 120,
    width: '100%',
  },
});
