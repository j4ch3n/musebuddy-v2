import { StyleSheet, Text, View } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';
import { chordNameSymbolForDisplay, ChordName, type ChordNameDisplayMode } from '@/ui';

export type TrainingChordTileProps = {
  chord: Pick<ChordDisplay, 'idName' | 'symbol' | 'tokens'>;
  colorized?: boolean;
  degree?: string;
  displayMode?: TrainingChordTileDisplayMode;
};

export type TrainingChordTileDisplayMode = ChordNameDisplayMode;

export function TrainingChordTile({
  chord,
  colorized = true,
  degree,
  displayMode = 'full-chord',
}: TrainingChordTileProps) {
  const displayedSymbol = chordNameSymbolForDisplay(chord.tokens, displayMode);

  return (
    <View
      accessibilityLabel={degree ? `${displayedSymbol}, degree ${degree}` : displayedSymbol}
      accessible
      style={styles.tile}
    >
      <View style={styles.content}>
        <ChordName
          colorized={colorized}
          display={chord}
          displayMode={displayMode}
          size="compact"
          style={styles.chordName}
        />
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
    lineHeight: 30,
    textAlign: 'left',
  },
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
