import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';
import { FlashCard, PianoKeyboard, type PianoKeyboardMarkerTone } from '@/ui';
import type { PianoPitchClass } from '@schema/music-theory-schema';

import ChordSheet from './chord-sheet.dom';
import {
  chordToneRoleByImportance,
  chordToneRoleColors,
  type ChordToneColorRole,
} from './chord-color-role';
import { ChordToneLegend } from './chord-role-legend';

type ChordKeyboardCardProps = {
  display: ChordDisplay;
  isFlipped?: boolean;
  onFlipChange?: (isFlipped: boolean) => void;
};

export function ChordKeyboardCard({ display, isFlipped, onFlipChange }: ChordKeyboardCardProps) {
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
    <FlashCard
      accessibilityLabel="Chord keyboard card"
      isFlipped={isFlipped}
      onFlipChange={onFlipChange}
      sideA={
        <View style={styles.keyboardContent}>
          <PianoKeyboard
            accessibilityLabel={`Piano keyboard highlighting ${noteNames}`}
            keys={selectedKeys}
            markerLabels={markerLabels}
            markerTones={markerTones}
            root={rootNote.pitchClass}
          />
          <ChordToneLegend roles={toneRoles} />
        </View>
      }
      sideB={
        <View style={styles.backContent}>
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
          <View style={styles.explanations}>
            {display.notes.map((note) =>
              note.explanation ? (
                <Text key={`${note.degree}-${note.text}`} style={styles.explanation}>
                  <Text
                    style={[
                      styles.noteName,
                      {
                        color:
                          chordToneRoleColors[
                            note.isRoot ? 'root' : chordToneRoleByImportance[note.importance]
                          ].fill,
                      },
                    ]}
                  >
                    {note.text}
                  </Text>
                  {` ${note.explanation}`}
                </Text>
              ) : null,
            )}
          </View>
        </View>
      }
      tone="wildflower"
    />
  );
}

const styles = StyleSheet.create({
  backContent: {
    gap: 16,
  },
  explanations: {
    gap: 8,
  },
  keyboardContent: {
    gap: 12,
  },
  explanation: {
    color: museBuddyColors.pine,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },
  noteName: {
    color: museBuddyColors.pine,
    fontWeight: '900',
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
