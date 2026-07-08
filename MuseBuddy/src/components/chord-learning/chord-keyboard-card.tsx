import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';
import { FlashCard, PianoKeyboard } from '@/ui';
import { normalizePianoKeyboardKey, type CanonicalPianoKeyboardKeyName } from '@/ui/piano-keyboard';

import ChordSheet from './chord-sheet.dom';

type ChordKeyboardCardProps = {
  display: ChordDisplay;
  isFlipped?: boolean;
  onFlipChange?: (isFlipped: boolean) => void;
};

export function ChordKeyboardCard({ display, isFlipped, onFlipChange }: ChordKeyboardCardProps) {
  const rootNote = display.notes.find((note) => note.isRoot) ?? display.notes[0];
  const selectedKeys = display.notes
    .filter((note) => note.keyboardKey !== rootNote.keyboardKey)
    .map((note) => note.keyboardKey);
  const noteNames = display.notes.map((note) => note.text).join(' - ');
  const markerLabels = display.notes.reduce<Partial<Record<CanonicalPianoKeyboardKeyName, string>>>(
    (labels, note) => {
      labels[normalizePianoKeyboardKey(note.keyboardKey)] = note.text;
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
          root={rootNote.keyboardKey}
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
                <Text key={`${note.interval}-${note.text}`} style={styles.explanation}>
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
