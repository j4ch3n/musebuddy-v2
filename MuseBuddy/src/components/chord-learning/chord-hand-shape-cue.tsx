import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import {
  derivePianoHandShapeCues,
  type ChordDisplayNote,
  type PianoHandShapeCue,
} from '@/music-theory';
import { HandSilhouette } from '@/ui';

type ChordHandShapeCueProps = {
  align?: 'center' | 'end' | 'start';
  hand: ChordHand;
  notes: readonly ChordDisplayNote[];
  size?: 'default' | 'large';
};

type Hand = 'left' | 'right';
export type ChordHand = Hand;

const HAND_ICON_WIDTH = 30;
const HAND_ICON_HEIGHT = 35;
const LARGE_HAND_ICON_WIDTH = 34;
const LARGE_HAND_ICON_HEIGHT = 40;

export function ChordHandShapeCue({
  align = 'center',
  hand,
  notes,
  size = 'default',
}: ChordHandShapeCueProps) {
  const handNotes = notes.filter((note) => note.hand === hand);
  const cue = derivePianoHandShapeCues(notes).find((candidate) => candidate.hand === hand);
  const description = `${hand} hand: ${
    handNotes.length ? handNotes.map(pitchName).join(', ') : 'No keys'
  }`;

  return (
    <View accessibilityLabel={`Hand shape: ${description}`} accessible style={styles.cue}>
      <HandDiagram align={align} cueName={cue?.name ?? 'No keys'} hand={hand} size={size} />
    </View>
  );
}

function HandDiagram({
  align,
  cueName,
  hand,
  size,
}: {
  align: 'center' | 'end' | 'start';
  cueName: PianoHandShapeCue['name'] | 'No keys';
  hand: Hand;
  size: NonNullable<ChordHandShapeCueProps['size']>;
}) {
  const isLarge = size === 'large';
  return (
    <View
      accessibilityElementsHidden
      style={[
        styles.handDiagram,
        align === 'end' ? styles.handDiagramEnd : null,
        align === 'start' ? styles.handDiagramStart : null,
      ]}
    >
      <HandSilhouette
        hand={hand}
        height={isLarge ? LARGE_HAND_ICON_HEIGHT : HAND_ICON_HEIGHT}
        width={isLarge ? LARGE_HAND_ICON_WIDTH : HAND_ICON_WIDTH}
      />
      <Text numberOfLines={1} style={[styles.handCue, isLarge ? styles.handCueLarge : null]}>
        {cueName}
      </Text>
    </View>
  );
}

function pitchName(note: ChordDisplayNote) {
  return `${note.letter}${note.accidental}`;
}

const styles = StyleSheet.create({
  cue: {
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: 40,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  handCue: { color: museBuddyColors.pine, flexShrink: 1, fontSize: 11, fontWeight: '800' },
  handCueLarge: { fontSize: 12 },
  handDiagram: { alignItems: 'center', flexDirection: 'row', flexWrap: 'nowrap', gap: 4 },
  handDiagramEnd: { alignSelf: 'flex-end' },
  handDiagramStart: { alignSelf: 'flex-start' },
});
