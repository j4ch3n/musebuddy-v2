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

type FlashCardBaseProps = {
  accessibilityLabel?: string;
  footer?: ReactNode;
  isFlipped?: boolean;
  onFlipChange?: (isFlipped: boolean) => void;
  onPageChange?: (pageIndex: number) => void;
  padded?: boolean;
  pages?: readonly FlashCardPage[];
  selectedPageIndex?: number;
  sideA: ReactNode;
  sideB?: ReactNode;
  style?: StyleProp<ViewStyle>;
  surface?: FlashCardSurface;
};

type FramedFlashCardProps = {
  borderColor?: string;
  frameless?: false;
  shadowColor: string;
  surfaceColor?: string;
};

type FramelessFlashCardProps = {
  borderColor?: never;
  frameless: true;
  shadowColor?: never;
  surfaceColor?: never;
};

type FlashCardProps = FlashCardBaseProps & (FramedFlashCardProps | FramelessFlashCardProps);

export function FlashCard({
  accessibilityLabel,
  footer,
  frameless = false,
  isFlipped: controlledIsFlipped,
  onFlipChange,
  onPageChange,
  padded = true,
  pages,
  selectedPageIndex,
  sideA,
  sideB,
  shadowColor,
  borderColor = museBuddyColors.frame,
  surfaceColor,
  style,
  surface = 'hero',
}: FlashCardProps) {
  const [uncontrolledIsFlipped, setUncontrolledIsFlipped] = useState(false);
  const isFlipped = controlledIsFlipped ?? uncontrolledIsFlipped;
  const backgroundStyle = frameless
    ? styles.framelessSurface
    : surfaceColor
      ? { backgroundColor: surfaceColor }
      : surface === 'supporting'
        ? styles.supportingSurface
        : styles.heroSurface;
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
      style={[
        frameless ? styles.frameless : styles.card,
        backgroundStyle,
        frameless ? null : { borderColor, boxShadow: `6px 6px 0 ${shadowColor}` },
        style,
      ]}
    >
      <YStack style={[styles.inner, backgroundStyle, padded ? styles.padded : null]}>
        {content}
        {footer ? <YStack style={styles.footer}>{footer}</YStack> : null}
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
  frameless: { flex: 1, margin: 0, overflow: 'hidden', padding: 0 },
  framelessSurface: { backgroundColor: 'transparent' },
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
  footer: {
    marginTop: 12,
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
    backgroundColor: museBuddyColors.paper,
  },
});
