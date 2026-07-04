import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

type FlashCardSurface = 'cream' | 'white';

type FlashCardProps = {
  accessibilityLabel?: string;
  children: ReactNode;
  isPressedStyleEnabled?: boolean;
  onPress?: () => void;
  padded?: boolean;
  surface?: FlashCardSurface;
};

export function FlashCard({
  accessibilityLabel,
  children,
  isPressedStyleEnabled = true,
  onPress,
  padded = true,
  surface = 'white',
}: FlashCardProps) {
  const backgroundStyle = surface === 'cream' ? styles.creamSurface : styles.whiteSurface;

  return (
    <YStack
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      pressStyle={onPress && isPressedStyleEnabled ? styles.cardPressed : undefined}
      style={[styles.card, backgroundStyle]}
    >
      <YStack style={[styles.inner, backgroundStyle, padded ? styles.padded : null]}>
        {children}
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
