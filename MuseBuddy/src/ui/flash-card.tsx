import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import { Carousel } from './carousel';

type FlashCardSurface = 'hero' | 'supporting';
export type FlashCardHeightMode = 'home-postcard' | 'daily-training' | 'fill';

export type FlashCardPage = {
  content: ReactNode;
  id: string;
  label: string;
};

type FlashCardBaseProps = {
  accessibilityLabel?: string;
  footer?: ReactNode;
  heightMode?: FlashCardHeightMode;
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
  heightMode,
  frameless = false,
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
  const [isFlipped, setIsFlipped] = useState(false);
  const flipProgress = useDerivedValue(() => withTiming(isFlipped ? 1 : 0, { duration: 280 }));
  const frontFaceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipProgress.value, [0, 0.45, 0.55, 1], [1, 0, 0, 0]),
    transform: [{ perspective: 900 }, { rotateY: `${flipProgress.value * 180}deg` }],
  }));
  const backFaceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipProgress.value, [0, 0.45, 0.55, 1], [0, 0, 0, 1]),
    transform: [{ perspective: 900 }, { rotateY: `${180 + flipProgress.value * 180}deg` }],
  }));
  const backgroundStyle = frameless
    ? styles.framelessSurface
    : surfaceColor
      ? { backgroundColor: surfaceColor }
      : surface === 'supporting'
        ? styles.supportingSurface
        : styles.heroSurface;
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
  ) : sideB ? (
    <YStack style={styles.flipSurface}>
      <Animated.View
        accessibilityElementsHidden={isFlipped}
        importantForAccessibility={isFlipped ? 'no-hide-descendants' : 'auto'}
        pointerEvents={isFlipped ? 'none' : 'auto'}
        style={[styles.face, frontFaceStyle]}
      >
        {sideA}
      </Animated.View>
      <Animated.View
        accessibilityElementsHidden={!isFlipped}
        importantForAccessibility={isFlipped ? 'auto' : 'no-hide-descendants'}
        pointerEvents={isFlipped ? 'auto' : 'none'}
        style={[styles.face, backFaceStyle]}
      >
        {sideB}
      </Animated.View>
    </YStack>
  ) : (
    sideA
  );

  return (
    <YStack
      accessibilityLabel={accessibilityLabel}
      style={[
        frameless ? styles.frameless : styles.card,
        backgroundStyle,
        heightMode ? heightModeStyles[heightMode] : null,
        frameless ? null : { borderColor, boxShadow: `6px 6px 0 ${shadowColor}` },
        style,
      ]}
    >
      <YStack style={[styles.inner, backgroundStyle, padded ? styles.padded : null]}>
        {content}
        {footer ? <YStack style={styles.footer}>{footer}</YStack> : null}
        {sideB && !pages ? (
          <Pressable
            accessibilityLabel={isFlipped ? 'Show front of card' : 'Show back of card'}
            accessibilityRole="button"
            onPress={() => setIsFlipped((currentIsFlipped) => !currentIsFlipped)}
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
  face: {
    alignItems: 'stretch',
    backfaceVisibility: 'hidden',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  flipSurface: { flex: 1, minHeight: 0 },
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

const heightModeStyles = StyleSheet.create({
  'daily-training': { height: 640 },
  fill: { flex: 1, minHeight: 0 },
  'home-postcard': { height: 410 },
});
