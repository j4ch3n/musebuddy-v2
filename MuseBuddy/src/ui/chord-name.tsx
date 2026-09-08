import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplay, ChordDisplayTokenType } from '@/music-theory';

import {
  chordSyntaxRoleByTokenType,
  chordSyntaxRoleColors,
  chordToneRoleColors,
} from '@/components/chord-learning/chord-color-role';
import {
  chordNameSymbolForDisplay,
  chordNameTokensForDisplay,
  type ChordNameDisplayMode,
} from './chord-name-display';

export { chordNameSymbolForDisplay } from './chord-name-display';
export type { ChordNameDisplayMode } from './chord-name-display';
export type ChordNameSize = 'large' | 'compact';

export type ChordNameProps = {
  colorized?: boolean;
  display: Pick<ChordDisplay, 'symbol' | 'tokens'>;
  displayMode?: ChordNameDisplayMode;
  size?: ChordNameSize;
  style?: StyleProp<TextStyle>;
};

export function ChordName({
  colorized = true,
  display,
  displayMode = 'full-chord',
  size = 'large',
  style,
}: ChordNameProps) {
  const displayedTokens = chordNameTokensForDisplay(display.tokens, displayMode);
  const displayedSymbol = chordNameSymbolForDisplay(display.tokens, displayMode);

  return (
    <Text
      accessibilityLabel={`Chord symbol ${displayedSymbol}`}
      style={[styles.symbol, sizeStyles[size], style]}
    >
      {displayedTokens.map((token, index) => (
        <Text
          key={`${token.type}-${token.text}-${index}`}
          style={[
            colorized ? tokenStyle(token) : styles.symbolText,
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

function tokenStyle(token: ChordDisplay['tokens'][number]) {
  if (token.teachingRole) {
    return { color: chordToneRoleColors[token.teachingRole].color };
  }
  return tokenStyles[token.type];
}

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
