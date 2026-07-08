import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { YStack } from 'tamagui';

import {
  museBuddyBorders,
  museBuddyColors,
  museBuddyRadii,
  museBuddyShadows,
} from '@/constants/design-tokens';

type FlashCardSurface = 'cream' | 'white';

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
  surface = 'white',
}: FlashCardProps) {
  const [uncontrolledIsFlipped, setUncontrolledIsFlipped] = useState(false);
  const isFlipped = controlledIsFlipped ?? uncontrolledIsFlipped;
  const backgroundStyle = surface === 'cream' ? styles.creamSurface : styles.whiteSurface;
  const activeSide = isFlipped && sideB ? sideB : sideA;

  return (
    <YStack
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      pressStyle={onPress && isPressedStyleEnabled ? styles.cardPressed : undefined}
      style={[styles.card, backgroundStyle]}
    >
      <YStack style={[styles.inner, backgroundStyle, padded ? styles.padded : null]}>
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
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.large,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 8px 0 ${museBuddyColors.ink}`,
    overflow: 'hidden',
  },
  cardPressed: {
    boxShadow: `0 3px 0 ${museBuddyColors.ink}`,
    transform: [{ translateY: 5 }],
  },
  creamSurface: {
    backgroundColor: museBuddyColors.surface,
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
  inner: {
    gap: 0,
  },
  padded: {
    padding: 18,
  },
  whiteSurface: {
    backgroundColor: museBuddyColors.white,
  },
});
