import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import { Carousel } from './carousel';

type FlashCardSurface = 'hero' | 'supporting';

export type FlashCardPage = {
  content: ReactNode;
  id: string;
  label: string;
};

type FlashCardProps = {
  accessibilityLabel?: string;
  isFlipped?: boolean;
  onFlipChange?: (isFlipped: boolean) => void;
  onPageChange?: (pageIndex: number) => void;
  padded?: boolean;
  pages?: readonly FlashCardPage[];
  selectedPageIndex?: number;
  sideA: ReactNode;
  sideB?: ReactNode;
  shadowColor: string;
  style?: StyleProp<ViewStyle>;
  surface?: FlashCardSurface;
};

export function FlashCard({
  accessibilityLabel,
  isFlipped: controlledIsFlipped,
  onFlipChange,
  onPageChange,
  padded = true,
  pages,
  selectedPageIndex,
  sideA,
  sideB,
  shadowColor,
  style,
  surface = 'hero',
}: FlashCardProps) {
  const [uncontrolledIsFlipped, setUncontrolledIsFlipped] = useState(false);
  const isFlipped = controlledIsFlipped ?? uncontrolledIsFlipped;
  const backgroundStyle = surface === 'supporting' ? styles.supportingSurface : styles.heroSurface;
  const activeSide = isFlipped && sideB ? sideB : sideA;
  const content = pages ? (
    <Carousel
      accessibilityLabel={accessibilityLabel ?? 'Flash card pages'}
      getItemAccessibilityLabel={(page) => page.label}
      items={pages}
      keyExtractor={(page) => page.id}
      onCurrentIndexChange={onPageChange}
      renderItem={(page) => page.content}
      selectedIndex={selectedPageIndex}
    />
  ) : (
    activeSide
  );

  return (
    <YStack
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, backgroundStyle, { boxShadow: `6px 6px 0 ${shadowColor}` }, style]}
    >
      <YStack style={[styles.inner, backgroundStyle, padded ? styles.padded : null]}>
        {content}
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
    flex: 1,
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
