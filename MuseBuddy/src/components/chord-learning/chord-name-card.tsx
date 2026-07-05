import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  museBuddyBorders,
  museBuddyColors,
  museBuddyRadii,
  museBuddyShadows,
} from '@/constants/design-tokens';
import type { ChordDisplay, ChordDisplayTokenType } from '@/music-theory';
import { FlashCard } from '@/ui';

import ChordSheet from './chord-sheet.dom';

type ChordNameCardProps = {
  display: ChordDisplay;
};

export function ChordNameCard({ display }: ChordNameCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <FlashCard
      accessibilityLabel={`Chord name card. ${isFlipped ? 'Showing sheet.' : 'Showing symbol.'}`}
    >
      {isFlipped ? (
        <View
          accessibilityLabel={`Sheet notes: ${display.notes.map((note) => note.text).join(', ')}`}
          style={styles.sheetFrame}
        >
          <ChordSheet
            dom={{
              scrollEnabled: false,
              style: styles.sheet,
            }}
            notes={display.notes}
          />
        </View>
      ) : (
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
      )}
      <Pressable
        accessibilityLabel={isFlipped ? 'Show chord name' : 'Show chord sheet'}
        accessibilityRole="button"
        onPress={() => {
          setIsFlipped((current) => !current);
        }}
        style={({ pressed }) => [styles.flipButton, pressed ? styles.flipButtonPressed : null]}
      >
        <Text style={styles.flipButtonText}>Tap to flip</Text>
      </Pressable>
    </FlashCard>
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
  flipButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: museBuddyColors.secondary,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.round,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 ${museBuddyShadows.dropSmall.y}px 0 ${museBuddyShadows.dropSmall.color}`,
    marginTop: 16,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  flipButtonPressed: {
    boxShadow: `0 1px 0 ${museBuddyColors.ink}`,
    transform: [{ translateY: 3 }],
  },
  flipButtonText: {
    color: museBuddyColors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  sheetFrame: {
    backgroundColor: museBuddyColors.white,
    height: 148,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheet: {
    backgroundColor: 'transparent',
    height: 148,
    width: '100%',
  },
});
