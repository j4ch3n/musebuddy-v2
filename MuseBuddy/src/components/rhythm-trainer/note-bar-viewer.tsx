import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import { RHYTHM_SHEET_HEIGHT_PX, RHYTHM_SHEET_WRAPPER_HEIGHT_PX } from './constants';
import NoteBarSheet from './note-bar-sheet.dom';
import { convertRhythmBarToVexflowEvents } from './note-bar-vexflow';
import type { RhythmStep } from './types';

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
    height: RHYTHM_SHEET_WRAPPER_HEIGHT_PX,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheet: {
    backgroundColor: 'transparent',
    height: RHYTHM_SHEET_HEIGHT_PX,
    width: '100%',
  },
});
