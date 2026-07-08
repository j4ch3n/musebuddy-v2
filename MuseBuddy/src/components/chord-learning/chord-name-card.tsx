import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplay, ChordDisplayTokenType } from '@/music-theory';
import { FlashCard } from '@/ui';

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
          <Text accessibilityLabel={`Chord symbol ${display.symbol}`} style={styles.symbol}>
            {display.tokens.map((token, index) => (
              <Text
                key={`${token.type}-${token.text}-${index}`}
                style={tokenStyles[token.type] ?? styles.symbolText}
              >
                {token.text}
              </Text>
            ))}
          </Text>
        </View>
      }
    />
  );
}

const tokenStyles = StyleSheet.create<Record<ChordDisplayTokenType, object>>({
  addition: {
    color: museBuddyColors.accentGreen,
  },
  alteration: {
    color: museBuddyColors.accentPurple,
  },
  bass: {
    color: museBuddyColors.accentBlue,
  },
  extension: {
    color: museBuddyColors.accentPurple,
  },
  omission: {
    color: museBuddyColors.accentRed,
  },
  quality: {
    color: museBuddyColors.accentBlue,
  },
  root: {
    color: museBuddyColors.accentRed,
  },
  separator: {
    color: museBuddyColors.ink,
  },
});

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
  symbol: {
    color: museBuddyColors.ink,
    fontSize: 54,
    fontWeight: '900',
    lineHeight: 60,
    textAlign: 'center',
  },
  symbolText: {
    color: museBuddyColors.ink,
  },
});
