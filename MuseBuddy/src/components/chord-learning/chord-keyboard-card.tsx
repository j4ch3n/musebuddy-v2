import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';
import { FlashCard, PianoKeyboard } from '@/ui';
import type { PianoPitchClass } from '@schema/music-theory-schema';

import ChordSheet from './chord-sheet.dom';

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

  return (
    <FlashCard
      accessibilityLabel="Chord keyboard card"
      isFlipped={isFlipped}
      onFlipChange={onFlipChange}
      sideA={
        <PianoKeyboard
          accessibilityLabel={`Piano keyboard highlighting ${noteNames}`}
          keyColor={museBuddyColors.accentBlue}
          keys={selectedKeys}
          markerLabels={markerLabels}
          root={rootNote.pitchClass}
          rootColor={museBuddyColors.accentRed}
        />
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
                  <Text style={styles.noteName}>{note.text}</Text>
                  {` ${note.explanation}`}
                </Text>
              ) : null,
            )}
          </View>
        </View>
      }
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
  explanation: {
    color: museBuddyColors.ink,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },
  noteName: {
    color: museBuddyColors.accentRed,
    fontWeight: '900',
  },
  sheet: {
    backgroundColor: 'transparent',
    height: 120,
    width: '100%',
  },
  sheetFrame: {
    backgroundColor: museBuddyColors.white,
    height: 120,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
