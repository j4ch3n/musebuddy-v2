import { StyleSheet, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';
import { PianoKeyboard, type PianoKeyboardMarkerTone } from '@/ui';
import type { PianoPitchClass } from '@schema/music-theory-schema';

import ChordSheet from './chord-sheet.dom';
import { chordToneRoleByImportance, type ChordToneColorRole } from './chord-color-role';
import { ChordToneLegend } from './chord-role-legend';

type ChordKeyboardCardProps = {
  display: ChordDisplay;
};

export function ChordKeyboardCard({ display }: ChordKeyboardCardProps) {
  const rootNote = display.notes.find((note) => note.isRoot) ?? display.notes[0];
  const selectedKeys = display.notes
    .filter((note) => note.pitchClass !== rootNote.pitchClass)
    .map((note) => note.pitchClass);
  const noteNames = display.notes.map((note) => note.text).join(' - ');
  const markerLabels = display.notes.reduce<Partial<Record<PianoPitchClass, string>>>(
    (labels, note) => {
      labels[note.pitchClass] = note.text;
      return labels;
    },
    {},
  );
  const markerTones = display.notes.reduce<
    Partial<Record<PianoPitchClass, PianoKeyboardMarkerTone>>
  >((tones, note) => {
    tones[note.pitchClass] = note.isRoot ? 'root' : chordToneRoleByImportance[note.importance];
    return tones;
  }, {});
  const toneRoles = display.notes.map<ChordToneColorRole>((note) =>
    note.isRoot ? 'root' : chordToneRoleByImportance[note.importance],
  );

  return (
    <View style={styles.content}>
      <PianoKeyboard
        accessibilityLabel={`Piano keyboard highlighting ${noteNames}`}
        keys={selectedKeys}
        markerLabels={markerLabels}
        markerTones={markerTones}
        root={rootNote.pitchClass}
      />
      <View
        accessibilityLabel={`Sheet notes: ${display.notes.map((note) => note.text).join(', ')}`}
        style={styles.sheetFrame}
      >
        <ChordSheet
          dom={{
            scrollEnabled: false,
            style: styles.sheet,
          }}
          notes={display.notes}
        />
      </View>
      <ChordToneLegend roles={toneRoles} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  sheet: {
    backgroundColor: museBuddyColors.mist,
    height: 120,
    width: '100%',
  },
  sheetFrame: {
    backgroundColor: museBuddyColors.mist,
    height: 120,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
