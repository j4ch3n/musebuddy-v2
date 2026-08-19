import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

type FlashCardSurface = 'hero' | 'supporting';
export type FlashCardTone = 'leaf' | 'neutral' | 'sky' | 'sun' | 'violet' | 'wildflower';

type FlashCardProps = {
  accessibilityLabel?: string;
  isFlipped?: boolean;
  isPressedStyleEnabled?: boolean;
  onFlipChange?: (isFlipped: boolean) => void;
  onPress?: () => void;
  padded?: boolean;
  sideA: ReactNode;
  sideB?: ReactNode;
  surface?: FlashCardSurface;
  tone?: FlashCardTone;
};

export function FlashCard({
  accessibilityLabel,
  isFlipped: controlledIsFlipped,
  isPressedStyleEnabled = true,
  onFlipChange,
  onPress,
  padded = true,
  sideA,
  sideB,
  surface = 'hero',
  tone = 'neutral',
}: FlashCardProps) {
  const [uncontrolledIsFlipped, setUncontrolledIsFlipped] = useState(false);
  const isFlipped = controlledIsFlipped ?? uncontrolledIsFlipped;
  const backgroundStyle = surface === 'supporting' ? styles.supportingSurface : styles.heroSurface;
  const activeSide = isFlipped && sideB ? sideB : sideA;
  const toneStyle = toneStyles[tone];

  return (
    <YStack
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      pressStyle={onPress && isPressedStyleEnabled ? styles.cardPressed : undefined}
      style={[styles.card, backgroundStyle, toneStyle.surface]}
    >
      <YStack
        style={[styles.inner, backgroundStyle, toneStyle.surface, padded ? styles.padded : null]}
      >
        {tone === 'neutral' ? null : (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.accentRail, toneStyle.rail]}
          />
        )}
        {activeSide}
        {sideB ? (
          <Pressable
            accessibilityLabel={isFlipped ? 'Show front of card' : 'Show back of card'}
            accessibilityRole="button"
            onPress={() => {
              const nextIsFlipped = !isFlipped;

              if (controlledIsFlipped === undefined) {
                setUncontrolledIsFlipped(nextIsFlipped);
              }

              onFlipChange?.(nextIsFlipped);
            }}
            style={({ pressed }) => [styles.flipButton, pressed ? styles.flipButtonPressed : null]}
          >
            <Text style={styles.flipButtonText}>Tap to flip</Text>
          </Pressable>
        ) : null}
      </YStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `6px 6px 0 ${museBuddyColors.frame}`,
    overflow: 'hidden',
  },
  cardPressed: {
    boxShadow: `2px 2px 0 ${museBuddyColors.frame}`,
    transform: [{ translateX: 4 }, { translateY: 4 }],
  },
  supportingSurface: {
    backgroundColor: museBuddyColors.mist,
  },
  flipButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `4px 4px 0 ${museBuddyColors.sky}`,
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  flipButtonPressed: {
    boxShadow: `1px 1px 0 ${museBuddyColors.sky}`,
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  flipButtonText: {
    color: museBuddyColors.pine,
    fontSize: 14,
    fontWeight: '900',
  },
  inner: {
    gap: 0,
    overflow: 'hidden',
  },
  padded: {
    padding: 18,
  },
  heroSurface: {
    backgroundColor: museBuddyColors.mist,
  },
  accentRail: {
    height: 8,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
});

const toneStyles = {
  neutral: {
    rail: {},
    surface: {},
  },
  wildflower: {
    rail: { backgroundColor: museBuddyColors.wildflower },
    surface: { backgroundColor: museBuddyColors.petal },
  },
  sky: {
    rail: { backgroundColor: museBuddyColors.sky },
    surface: { backgroundColor: museBuddyColors.skyWash },
  },
  leaf: {
    rail: { backgroundColor: museBuddyColors.leaf },
    surface: { backgroundColor: museBuddyColors.leafWash },
  },
  sun: {
    rail: { backgroundColor: museBuddyColors.sun },
    surface: { backgroundColor: museBuddyColors.sunWash },
  },
  violet: {
    rail: { backgroundColor: museBuddyColors.violet },
    surface: { backgroundColor: museBuddyColors.violetWash },
  },
} as const;
