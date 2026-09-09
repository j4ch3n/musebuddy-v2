import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { museBuddyColors } from '@/constants/design-tokens';
import {
  derivePianoHandShapeCues,
  type ChordDisplayNote,
  type PianoHandShapeCue,
} from '@/music-theory';

type ChordHandShapeCueProps = {
  align?: 'center' | 'end' | 'start';
  hand: ChordHand;
  notes: readonly ChordDisplayNote[];
};

type Hand = 'left' | 'right';
export type ChordHand = Hand;

const RIGHT_HAND_PATH =
  'M404.17,628.475c-11.275-12.591-27.489-22.977-44.168-30.53c-15.36-6.95-31.144-11.52-43.853-12.954c-13.944-1.643-24.595,0.266-31.676,5.625c-2.282,1.722-4.491,3.646-6.591,5.723c-13.653,13.466-23.954,35.198-14.416,51.155c4.103,6.945,11.202,11.553,18.725,16.428c7.796,5.038,19.688,10.591,30.563,20.374c3.056,2.739,6.101,5.683,8.849,9.212c21.2,27.062,70.179,87.597,100.288,119.885c6.246,3.907,19.531,17.124,25.788,20.489c19.003,12.12,34.515,23.567,39.925,29.74c4.188,4.832,29.069,17.578,29.069,17.578c20.129,12.727,56.72,24.622,99.011,24.622c42.219,0,80.541,2.53,108.87-22.392h1.513l0.744-1.888c28.869-26.399,46.746-62.993,46.746-103.424l4.466-43.164l0.018-0.018c12.025-116.09,24.971-166.413,50.644-237.01l3.407-8.177l18.398-43.998c7.274-19.258-1.797-40.579-20.299-47.523l-2.414-0.926c-23.489-8.839-50.009,3.795-59.214,28.284l-7.123,20.959l-28.826,84.992c-2.972-0.227-5.84-0.169-8.673,0.167l21.824-140.747l5.326-34.363c5.113-26.741-5.423-51.249-23.573-54.686l-2.349-0.472c-23.022-4.382-46.946,19.524-53.427,53.513l-5.156,24.208l-27.289,128.044c-3.964,1.697-7.39,3.661-10.142,5.664c-0.594-1.268-1.339-2.403-2.004-3.589l4.957-182.385l0.708-25.624c0-28.587-16.964-51.793-37.88-51.793h-2.717c-26.569,0-48.084,29.419-48.084,65.728l-0.345,15.406l-3.971,172.154c-1.052,0.811-2.124,1.528-3.189,2.321l-35.217-156.912l-2.07-9.12c-4.66-22.641-30.896-55.383-53.561-50.716l-2.923,0.62c-28.772,5.931-47.272,34.064-41.305,62.802l5.864,33.635l31.845,183.063c-0.574,34.024-6.203,90.654-6.203,90.654C423.778,649.663,413.435,638.823,404.17,628.475z';
const HAND_ICON_WIDTH = 30;
const HAND_ICON_HEIGHT = 35;
export function ChordHandShapeCue({ align = 'center', hand, notes }: ChordHandShapeCueProps) {
  const handNotes = notes.filter((note) => note.hand === hand);
  const cue = derivePianoHandShapeCues(notes).find((candidate) => candidate.hand === hand);
  const description = `${hand} hand: ${
    handNotes.length ? handNotes.map(pitchName).join(', ') : 'No keys'
  }`;

  return (
    <View accessibilityLabel={`Hand shape: ${description}`} accessible style={styles.cue}>
      <HandDiagram align={align} cueName={cue?.name ?? 'No keys'} hand={hand} />
    </View>
  );
}

function HandDiagram({
  align,
  cueName,
  hand,
}: {
  align: 'center' | 'end' | 'start';
  cueName: PianoHandShapeCue['name'] | 'No keys';
  hand: Hand;
}) {
  const isLeftHand = hand === 'left';
  return (
    <View
      accessibilityElementsHidden
      style={[
        styles.handDiagram,
        align === 'end' ? styles.handDiagramEnd : null,
        align === 'start' ? styles.handDiagramStart : null,
      ]}
    >
      <Svg height={HAND_ICON_HEIGHT} viewBox="0 0 100 118" width={HAND_ICON_WIDTH}>
        <G transform="translate(-25 -20) scale(0.145)">
          <Path
            d={RIGHT_HAND_PATH}
            fill={museBuddyColors.paper}
            stroke={museBuddyColors.pine}
            strokeWidth={18}
            transform={isLeftHand ? 'translate(1122 0) scale(-1 1)' : undefined}
          />
        </G>
      </Svg>
      <Text numberOfLines={1} style={styles.handCue}>
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
  handDiagram: { alignItems: 'center', flexDirection: 'row', flexWrap: 'nowrap', gap: 4 },
  handDiagramEnd: { alignSelf: 'flex-end' },
  handDiagramStart: { alignSelf: 'flex-start' },
});
