import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import { RHYTHM_SHEET_HEIGHT_PX, RHYTHM_SHEET_WRAPPER_HEIGHT_PX } from './constants';
import NoteBarSheet from './note-bar-sheet.dom';
import { convertRhythmBarToVexflowEvents, type NoteBarVexflowEvent } from './note-bar-vexflow';
import type { RhythmStep } from './types';

type NoteBarViewerProps = {
  currentStepIndex: number | null;
  events?: readonly NoteBarVexflowEvent[];
  steps: readonly RhythmStep[];
};

export function NoteBarViewer({
  currentStepIndex,
  events: suppliedEvents,
  steps,
}: NoteBarViewerProps) {
  const derivedEvents = useMemo(() => convertRhythmBarToVexflowEvents(steps), [steps]);
  const events = suppliedEvents ?? derivedEvents;

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
    backgroundColor: museBuddyColors.mist,
    borderRadius: museBuddyRadii.medium,
    height: RHYTHM_SHEET_WRAPPER_HEIGHT_PX,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheet: {
    backgroundColor: museBuddyColors.mist,
    height: RHYTHM_SHEET_HEIGHT_PX,
    width: '100%',
  },
});
