import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplay, ChordDisplayTokenType } from '@/music-theory';

import { chordSyntaxRoleByTokenType, chordSyntaxRoleColors } from './chord-color-role';

type ChordNameSize = 'large' | 'compact';

type ChordNameProps = {
  colorized?: boolean;
  display: ChordDisplay;
  size?: ChordNameSize;
  style?: StyleProp<TextStyle>;
};

export function ChordName({ colorized = true, display, size = 'large', style }: ChordNameProps) {
  return (
    <Text
      accessibilityLabel={`Chord symbol ${display.symbol}`}
      style={[styles.symbol, sizeStyles[size], style]}
    >
      {display.tokens.map((token, index) => (
        <Text
          key={`${token.type}-${token.text}-${index}`}
          style={[
            colorized ? tokenStyles[token.type] : styles.symbolText,
            isDetailToken(token.type) ? tokenSizeStyles[size] : null,
          ]}
        >
          {token.text}
        </Text>
      ))}
    </Text>
  );
}

function isDetailToken(type: ChordDisplayTokenType) {
  return ['addition', 'alteration', 'bass', 'extension', 'omission', 'separator'].includes(type);
}

const tokenStyles = StyleSheet.create(
  Object.fromEntries(
    Object.entries(chordSyntaxRoleByTokenType).map(([type, role]) => [
      type,
      { color: chordSyntaxRoleColors[role].color },
    ]),
  ) as Record<ChordDisplayTokenType, TextStyle>,
);

const styles = StyleSheet.create({
  symbol: {
    color: museBuddyColors.pine,
    fontWeight: '900',
    textAlign: 'center',
  },
  symbolText: {
    color: museBuddyColors.pine,
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

const tokenSizeStyles = StyleSheet.create<Record<ChordNameSize, TextStyle>>({
  compact: {
    fontSize: 20,
    lineHeight: 30,
  },
  large: {
    fontSize: 34,
    lineHeight: 54,
  },
});
