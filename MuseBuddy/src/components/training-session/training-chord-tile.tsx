import { StyleSheet, Text, View } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';

export type TrainingChordTileProps = {
  chord: Pick<ChordDisplay, 'idName' | 'symbol' | 'tokens'>;
  degree?: string;
};

export function TrainingChordTile({ chord, degree }: TrainingChordTileProps) {
  return (
    <View
      accessibilityLabel={degree ? `${chord.symbol}, degree ${degree}` : chord.symbol}
      accessible
      style={styles.tile}
    >
      <View style={styles.content}>
        <Text style={styles.chordName}>
          {chord.tokens.map((token, index) => (
            <Text
              key={`${token.type}-${token.text}-${index}`}
              style={tokenStyle(token.type, token.teachingRole)}
            >
              {token.text}
            </Text>
          ))}
        </Text>
        {degree ? (
          <View style={styles.degreePanel}>
            <Text style={styles.degreeLabel}>DEGREE</Text>
            <Text style={styles.degree}>{degree}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function tokenStyle(
  type: TrainingChordTileProps['chord']['tokens'][number]['type'],
  teachingRole: TrainingChordTileProps['chord']['tokens'][number]['teachingRole'],
) {
  if (type === 'root') return styles.root;
  if (teachingRole === 'color') return styles.colorTone;
  return undefined;
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: museBuddyColors.paper,
    borderColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.large,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `5px 6px 0 ${museBuddyColors.leaf}`,
    flex: 1,
    marginBottom: 6,
    minWidth: 0,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  chordName: {
    color: museBuddyColors.pine,
    flex: 1,
    flexShrink: 1,
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 30,
  },
  root: { color: museBuddyColors.chordRoot },
  colorTone: { color: museBuddyColors.chordColorTone },
  degreePanel: {
    borderLeftColor: museBuddyColors.pine,
    borderLeftWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingLeft: 8,
    width: 46,
  },
  degree: {
    color: museBuddyColors.pine,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 26,
    textAlign: 'center',
  },
  degreeLabel: {
    color: museBuddyColors.pine,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 13,
    textAlign: 'center',
  },
});
