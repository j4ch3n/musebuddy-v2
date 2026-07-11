import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';
import { FlashCard } from '@/ui';

import { ChordName } from './chord-name';

type ChordNameCardProps = {
  display: ChordDisplay;
};

export function ChordNameCard({ display }: ChordNameCardProps) {
  return (
    <FlashCard
      accessibilityLabel="Chord name card"
      sideA={
        <View style={styles.content}>
          <Text style={styles.friendlyName}>{display.friendlyName}</Text>
          <ChordName display={display} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  friendlyName: {
    alignSelf: 'flex-start',
    color: museBuddyColors.primary,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
});
