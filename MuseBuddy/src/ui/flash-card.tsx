import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

type FlashCardSurface = 'hero' | 'supporting';

type FlashCardProps = {
  accessibilityLabel?: string;
  isFlipped?: boolean;
  onFlipChange?: (isFlipped: boolean) => void;
  padded?: boolean;
  sideA: ReactNode;
  sideB?: ReactNode;
  shadowColor: string;
  surface?: FlashCardSurface;
};

export function FlashCard({
  accessibilityLabel,
  isFlipped: controlledIsFlipped,
  onFlipChange,
  padded = true,
  sideA,
  sideB,
  shadowColor,
  surface = 'hero',
}: FlashCardProps) {
  const [uncontrolledIsFlipped, setUncontrolledIsFlipped] = useState(false);
  const isFlipped = controlledIsFlipped ?? uncontrolledIsFlipped;
  const backgroundStyle = surface === 'supporting' ? styles.supportingSurface : styles.heroSurface;
  const activeSide = isFlipped && sideB ? sideB : sideA;

  return (
    <YStack
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, backgroundStyle, { boxShadow: `6px 6px 0 ${shadowColor}` }]}
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
            style={({ pressed }) => [
              styles.flipButton,
              { boxShadow: `${pressed ? 1 : 4}px ${pressed ? 1 : 4}px 0 ${shadowColor}` },
              pressed ? styles.flipButtonPressed : null,
            ]}
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
    overflow: 'hidden',
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
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  flipButtonPressed: {
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
});
