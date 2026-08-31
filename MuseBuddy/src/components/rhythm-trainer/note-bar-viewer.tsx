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
  surfaceColor?: string;
  width?: number;
};

export function NoteBarViewer({
  clef = 'treble',
  currentStepIndex,
  events: suppliedEvents,
  showClefAndTimeSignature = true,
  steps,
  surfaceColor = museBuddyColors.mist,
  width = RHYTHM_MEASURE_WIDTH_PX,
}: NoteBarViewerProps) {
  const derivedEvents = useMemo(
    () => convertRhythmBarToVexflowEvents(steps, { clef }),
    [clef, steps],
  );
  const events = suppliedEvents ?? derivedEvents;

  return (
    <View
      accessibilityLabel="Note preview for rhythm bar"
      style={[styles.container, { backgroundColor: surfaceColor, width }]}
    >
      <NoteBarSheet
        clef={clef}
        currentStepIndex={currentStepIndex}
        dom={{
          scrollEnabled: false,
          style: styles.sheet,
        }}
        events={events}
        showClefAndTimeSignature={showClefAndTimeSignature}
        surfaceColor={surfaceColor}
        width={width}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: museBuddyRadii.medium,
    height: RHYTHM_SHEET_WRAPPER_HEIGHT_PX,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheet: {
    height: RHYTHM_SHEET_HEIGHT_PX,
    width: RHYTHM_MEASURE_WIDTH_PX,
  },
});
