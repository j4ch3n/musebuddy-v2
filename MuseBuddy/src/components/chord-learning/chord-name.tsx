import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplay, ChordDisplayTokenType } from '@/music-theory';

type ChordNameSize = 'large' | 'compact';

type ChordNameProps = {
  display: ChordDisplay;
  size?: ChordNameSize;
  style?: StyleProp<TextStyle>;
};

export function ChordName({ display, size = 'large', style }: ChordNameProps) {
  return (
    <Text
      accessibilityLabel={`Chord symbol ${display.symbol}`}
      style={[styles.symbol, sizeStyles[size], style]}
    >
      {display.tokens.map((token, index) => (
        <Text
          key={`${token.type}-${token.text}-${index}`}
          style={tokenStyles[token.type] ?? styles.symbolText}
        >
          {token.text}
        </Text>
      ))}
    </Text>
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
  symbol: {
    color: museBuddyColors.ink,
    fontWeight: '900',
    textAlign: 'center',
  },
  symbolText: {
    color: museBuddyColors.ink,
  },
});

const sizeStyles = StyleSheet.create<Record<ChordNameSize, TextStyle>>({
  compact: {
    fontSize: 30,
    lineHeight: 36,
  },
  large: {
    fontSize: 54,
    lineHeight: 60,
  },
});
