import { StyleSheet, Text, View } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';

import { ChordName } from './chord-name';

type ChordNameCardProps = {
  display: ChordDisplay;
};

export function ChordNameCard({ display }: ChordNameCardProps) {
  return (
    <View accessibilityLabel="Chord name card" accessible style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.friendlyName}>{display.friendlyName}</Text>
        <ChordName display={display} size="compact" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `6px 7px 0 ${museBuddyColors.frame}`,
    padding: 10,
    overflow: 'hidden',
  },
  content: {
    gap: 12,
    padding: 6,
  },
  friendlyName: {
    alignSelf: 'flex-start',
    color: museBuddyColors.pine,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
});
