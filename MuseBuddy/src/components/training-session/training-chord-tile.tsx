import { StyleSheet, Text, View } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';
import { chordNameSymbolForDisplay, ChordName, type ChordNameDisplayMode } from '@/ui';

export type TrainingChordTileProps = {
  chord: Pick<ChordDisplay, 'idName' | 'symbol' | 'tokens'>;
  colorized?: boolean;
  degree: string;
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
      accessibilityLabel={`${displayedSymbol}, degree ${degree}`}
      accessible
      style={styles.tile}
    >
      <View style={styles.content}>
        <View style={styles.chordNameZone}>
          <ChordName
            adjustsFontSizeToFit
            colorized={colorized}
            display={chord}
            displayMode={displayMode}
            minimumFontScale={0.8}
            size="compact"
            style={styles.chordName}
          />
        </View>
        <View style={styles.degreeRow}>
          <Text style={styles.degree}>{degree}</Text>
        </View>
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
    flex: 1,
    paddingHorizontal: 10,
    position: 'relative',
  },
  chordNameZone: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  chordName: {
    color: museBuddyColors.pine,
    fontSize: 30,
    height: 36,
    lineHeight: 36,
    textAlign: 'left',
  },
  degreeRow: {
    bottom: 14,
    position: 'absolute',
    right: 10,
  },
  degree: {
    color: museBuddyColors.pine,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 26,
    textAlign: 'right',
    width: 42,
  },
});
