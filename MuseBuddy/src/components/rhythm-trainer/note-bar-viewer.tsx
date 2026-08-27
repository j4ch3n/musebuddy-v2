import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import {
  RHYTHM_MEASURE_WIDTH_PX,
  RHYTHM_SHEET_HEIGHT_PX,
  RHYTHM_SHEET_WRAPPER_HEIGHT_PX,
} from './constants';
import NoteBarSheet from './note-bar-sheet.dom';
import { convertRhythmBarToVexflowEvents, type NoteBarVexflowEvent } from './note-bar-vexflow';
import type { RhythmStep } from './types';

type NoteBarViewerProps = {
  clef?: 'bass' | 'treble';
  currentStepIndex: number | null;
  events?: readonly NoteBarVexflowEvent[];
  showClefAndTimeSignature?: boolean;
  steps: readonly RhythmStep[];
  width?: number;
};

export function NoteBarViewer({
  clef = 'treble',
  currentStepIndex,
  events: suppliedEvents,
  showClefAndTimeSignature = true,
  steps,
  width = RHYTHM_MEASURE_WIDTH_PX,
}: NoteBarViewerProps) {
  const derivedEvents = useMemo(
    () => convertRhythmBarToVexflowEvents(steps, { clef }),
    [clef, steps],
  );
  const events = suppliedEvents ?? derivedEvents;

  return (
    <View accessibilityLabel="Note preview for rhythm bar" style={[styles.container, { width }]}>
      <NoteBarSheet
        clef={clef}
        currentStepIndex={currentStepIndex}
        dom={{
          scrollEnabled: false,
          style: styles.sheet,
        }}
        events={events}
        showClefAndTimeSignature={showClefAndTimeSignature}
        width={width}
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
    width: RHYTHM_MEASURE_WIDTH_PX,
  },
});
