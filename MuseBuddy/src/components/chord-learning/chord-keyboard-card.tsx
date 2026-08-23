import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors, museBuddyTypography } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';
import { PianoKeyboard, type PianoKeyboardLiveKeyState, type PianoKeyboardMarkerTone } from '@/ui';
import type { PianoPitchClass } from '@schema/music-theory-schema';

import ChordSheet from './chord-sheet.dom';
import {
  chordToneRoleByImportance,
  chordToneMarkerAppearances,
  type ChordToneColorRole,
} from './chord-color-role';
import { ChordToneLegend } from './chord-role-legend';

type ChordKeyboardCardProps = {
  display: ChordDisplay;
  errorMessage?: string;
  liveKeys?: Partial<Record<PianoPitchClass, PianoKeyboardLiveKeyState>>;
};

export function ChordKeyboardCard({
  display,
  errorMessage,
  liveKeys = {},
}: ChordKeyboardCardProps) {
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
      <View style={styles.keyboardFrame}>
        <PianoKeyboard
          accessibilityLabel={`Piano keyboard highlighting ${noteNames}`}
          keys={selectedKeys}
          markerAppearances={chordToneMarkerAppearances}
          markerLabels={markerLabels}
          markerTones={markerTones}
          liveKeys={liveKeys}
          root={rootNote.pitchClass}
        />
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
  errorText: {
    color: museBuddyColors.pine,
    fontFamily: museBuddyTypography.rounded,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  keyboardFrame: {
    alignSelf: 'center',
    transform: [{ translateX: 8 }],
    width: '100%',
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
