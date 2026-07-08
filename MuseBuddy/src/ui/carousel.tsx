/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated by worklets. */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  buildInitialCarouselSlots,
  getCarouselSwipeDirection,
  getWrappedCarouselIndex,
  rotateCarouselSlots,
  shouldCommitCarouselSwipe,
  type CarouselDirection,
} from './carousel-utils';

export type CarouselProps<T> = {
  accessibilityLabel?: string;
  getItemAccessibilityLabel?: (item: T, index: number) => string;
  items: readonly T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
};

type CarouselItemProps = {
  accessibilityHidden?: boolean;
  children: ReactNode;
  dragOffset: SharedValue<number>;
  layoutIndex: number;
  loopOffset?: number;
  slotPositions: SharedValue<number[]>;
  stride: number;
  width: number;
};

const ACTIVE_OFFSET = 12;
const FLY_DURATION_MS = 180;
const ITEM_GAP = 20;

function CarouselItem({
  accessibilityHidden = false,
  children,
  dragOffset,
  layoutIndex,
  loopOffset = 0,
  slotPositions,
  stride,
  width,
}: CarouselItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const itemIndex = layoutIndex % slotPositions.value.length;
    const slot = slotPositions.value[itemIndex] ?? 0;

    return {
      transform: [
        {
          translateX: (slot + loopOffset - layoutIndex) * stride + dragOffset.value,
        },
      ],
    };
  });

  return (
    <Animated.View
      accessibilityElementsHidden={accessibilityHidden}
      importantForAccessibility={accessibilityHidden ? 'no-hide-descendants' : 'auto'}
      style={[styles.item, { width }, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

export function Carousel<T>({
  accessibilityLabel = 'Carousel',
  getItemAccessibilityLabel,
  items,
  keyExtractor,
  renderItem,
}: CarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const dragOffset = useSharedValue(0);
  const isTransitioning = useSharedValue(false);
  const slotPositions = useSharedValue(buildInitialCarouselSlots(items.length));
  const hasAnnouncedItem = useRef(false);
  const itemCount = items.length;
  const safeCurrentIndex = currentIndex < itemCount ? currentIndex : 0;
  const currentItem = items[safeCurrentIndex];
  const stride = width + ITEM_GAP;
  const itemLabel = currentItem
    ? getItemAccessibilityLabel?.(currentItem, safeCurrentIndex)
    : undefined;

  useEffect(() => {
    if (!itemLabel || !hasAnnouncedItem.current) {
      hasAnnouncedItem.current = true;
      return;
    }

    AccessibilityInfo.announceForAccessibility(itemLabel);
  }, [itemLabel]);

  const updateCurrentIndex = useCallback(
    (direction: CarouselDirection) => {
      setCurrentIndex((current) => getWrappedCarouselIndex(current, direction, itemCount));
    },
    [itemCount],
  );

  const move = useCallback(
    (direction: CarouselDirection) => {
      if (itemCount <= 1 || width <= 0 || isTransitioning.value) {
        return;
      }

      isTransitioning.value = true;
      dragOffset.value = withTiming(
        -direction * stride,
        {
          duration: FLY_DURATION_MS,
          reduceMotion: ReduceMotion.System,
        },
        (finished) => {
          if (!finished) {
            isTransitioning.value = false;
            return;
          }

          slotPositions.value = rotateCarouselSlots(slotPositions.value, direction, itemCount);
          dragOffset.value = 0;
          isTransitioning.value = false;
          runOnJS(updateCurrentIndex)(direction);
        },
      );
    },
    [dragOffset, isTransitioning, itemCount, slotPositions, stride, updateCurrentIndex, width],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(itemCount > 1)
        .activeOffsetX([-ACTIVE_OFFSET, ACTIVE_OFFSET])
        .failOffsetY([-ACTIVE_OFFSET, ACTIVE_OFFSET])
        .onUpdate((event) => {
          if (!isTransitioning.value) {
            dragOffset.value = event.translationX;
          }
        })
        .onEnd((event) => {
          if (isTransitioning.value) {
            return;
          }

          if (shouldCommitCarouselSwipe(event.translationX, event.velocityX, width)) {
            const direction = getCarouselSwipeDirection(event.translationX, event.velocityX);
            isTransitioning.value = true;
            dragOffset.value = withTiming(
              -direction * stride,
              {
                duration: FLY_DURATION_MS,
                reduceMotion: ReduceMotion.System,
              },
              (finished) => {
                if (!finished) {
                  isTransitioning.value = false;
                  return;
                }

                slotPositions.value = rotateCarouselSlots(
                  slotPositions.value,
                  direction,
                  itemCount,
                );
                dragOffset.value = 0;
                isTransitioning.value = false;
                runOnJS(updateCurrentIndex)(direction);
              },
            );
            return;
          }

          dragOffset.value = withSpring(0, {
            damping: 18,
            reduceMotion: ReduceMotion.System,
            stiffness: 220,
          });
        }),
    [dragOffset, isTransitioning, itemCount, slotPositions, stride, updateCurrentIndex, width],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'increment') {
        move(1);
      } else if (event.nativeEvent.actionName === 'decrement') {
        move(-1);
      }
    },
    [move],
  );

  if (!currentItem) {
    return null;
  }

  const duplicateItems = itemCount === 2 ? items : [];

  return (
    <View onLayout={handleLayout} style={styles.viewport}>
      <View
        accessible
        accessibilityActions={[
          { label: 'Next item', name: 'increment' },
          { label: 'Previous item', name: 'decrement' },
        ]}
        accessibilityHint={itemCount > 1 ? 'Swipe up or down to browse items.' : undefined}
        accessibilityLabel={itemLabel ? `${accessibilityLabel}, ${itemLabel}` : accessibilityLabel}
        accessibilityRole="adjustable"
        onAccessibilityAction={handleAccessibilityAction}
        style={styles.accessibilityControl}
      />
      <GestureDetector gesture={panGesture}>
        <View style={styles.track}>
          {items.map((item, index) => (
            <CarouselItem
              dragOffset={dragOffset}
              key={keyExtractor(item, index)}
              layoutIndex={index}
              slotPositions={slotPositions}
              stride={stride}
              width={width}
            >
              {renderItem(item, index)}
            </CarouselItem>
          ))}
          {duplicateItems.map((item, index) => (
            <CarouselItem
              accessibilityHidden
              dragOffset={dragOffset}
              key={`${keyExtractor(item, index)}-carousel-duplicate`}
              layoutIndex={itemCount + index}
              loopOffset={itemCount}
              slotPositions={slotPositions}
              stride={stride}
              width={width}
            >
              {renderItem(item, index)}
            </CarouselItem>
          ))}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  accessibilityControl: {
    height: 1,
    opacity: 0,
    position: 'absolute',
    width: 1,
  },
  item: {
    flexShrink: 0,
    paddingBottom: 8,
  },
  track: {
    flexDirection: 'row',
    gap: ITEM_GAP,
  },
  viewport: {
    overflow: 'hidden',
  },
});
