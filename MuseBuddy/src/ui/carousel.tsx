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
  cancelAnimation,
  Easing,
  ReduceMotion,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { museBuddyColors } from '@/constants/design-tokens';

import {
  getBoundedCarouselIndex,
  getCarouselSwipeDirection,
  shouldCommitCarouselSwipe,
  type CarouselDirection,
} from './carousel-utils';

export type CarouselProps<T> = {
  accessibilityLabel?: string;
  getItemAccessibilityLabel?: (item: T, index: number) => string;
  items: readonly T[];
  indicatorActiveColor?: string;
  indicatorInactiveColor?: string;
  keyExtractor: (item: T, index: number) => string;
  onCurrentIndexChange?: (index: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  selectedIndex?: number;
  swipeEnabled?: boolean;
};

type CarouselItemProps = {
  accessibilityHidden?: boolean;
  children: ReactNode;
  currentIndex: SharedValue<number>;
  dragOffset: SharedValue<number>;
  stride: number;
  width: number;
};

const ACTIVE_OFFSET = 12;
const EDGE_DRAG_LIMIT = 44;
const EDGE_DRAG_RESISTANCE = 0.28;
const FLY_DURATION_MS = 170;
const ITEM_GAP = 20;
const SLIDE_SPRING = {
  damping: 19,
  mass: 0.55,
  reduceMotion: ReduceMotion.System,
  stiffness: 230,
};

function CarouselItem({
  accessibilityHidden = false,
  children,
  currentIndex,
  dragOffset,
  stride,
  width,
}: CarouselItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: -currentIndex.value * stride + dragOffset.value,
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

function getResistedDragOffset(
  translationX: number,
  currentIndex: number,
  itemCount: number,
): number {
  'worklet';

  const isPullingBeforeFirst = currentIndex <= 0 && translationX > 0;
  const isPullingAfterLast = currentIndex >= itemCount - 1 && translationX < 0;

  if (!isPullingBeforeFirst && !isPullingAfterLast) {
    return translationX;
  }

  const resistedOffset = translationX * EDGE_DRAG_RESISTANCE;
  return Math.max(-EDGE_DRAG_LIMIT, Math.min(resistedOffset, EDGE_DRAG_LIMIT));
}

export function Carousel<T>({
  accessibilityLabel = 'Carousel',
  getItemAccessibilityLabel,
  items,
  indicatorActiveColor = museBuddyColors.wildflower,
  indicatorInactiveColor = museBuddyColors.sky,
  keyExtractor,
  onCurrentIndexChange,
  renderItem,
  selectedIndex,
  swipeEnabled = true,
}: CarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const animatedCurrentIndex = useSharedValue(0);
  const dragOffset = useSharedValue(0);
  const isTransitioning = useSharedValue(false);
  const hasAnnouncedItem = useRef(false);
  const itemCount = items.length;
  const requestedCurrentIndex = selectedIndex ?? currentIndex;
  const safeCurrentIndex =
    itemCount > 0 ? Math.max(0, Math.min(requestedCurrentIndex, itemCount - 1)) : 0;
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
    (nextIndex: number) => {
      setCurrentIndex(nextIndex);
      onCurrentIndexChange?.(nextIndex);
    },
    [onCurrentIndexChange],
  );

  useEffect(() => {
    animatedCurrentIndex.value = safeCurrentIndex;
    dragOffset.value = 0;
  }, [animatedCurrentIndex, dragOffset, safeCurrentIndex]);

  useEffect(() => {
    if (swipeEnabled) {
      return;
    }

    cancelAnimation(dragOffset);
    animatedCurrentIndex.value = safeCurrentIndex;
    dragOffset.value = 0;
    isTransitioning.value = false;
  }, [animatedCurrentIndex, dragOffset, isTransitioning, safeCurrentIndex, swipeEnabled]);

  const canMove = useCallback(
    (direction: CarouselDirection) =>
      getBoundedCarouselIndex(safeCurrentIndex, direction, itemCount) !== safeCurrentIndex,
    [itemCount, safeCurrentIndex],
  );

  const completeMove = useCallback(
    (nextIndex: number) => {
      animatedCurrentIndex.value = nextIndex;
      dragOffset.value = 0;
      isTransitioning.value = false;
      updateCurrentIndex(nextIndex);
    },
    [animatedCurrentIndex, dragOffset, isTransitioning, updateCurrentIndex],
  );

  const move = useCallback(
    (direction: CarouselDirection) => {
      if (
        !swipeEnabled ||
        itemCount <= 1 ||
        width <= 0 ||
        isTransitioning.value ||
        !canMove(direction)
      ) {
        return;
      }

      const nextIndex = getBoundedCarouselIndex(safeCurrentIndex, direction, itemCount);
      isTransitioning.value = true;
      dragOffset.value = withTiming(
        -direction * stride,
        {
          duration: FLY_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        },
        (finished) => {
          if (!finished) {
            isTransitioning.value = false;
            return;
          }

          runOnJS(completeMove)(nextIndex);
        },
      );
    },
    [
      canMove,
      completeMove,
      dragOffset,
      isTransitioning,
      itemCount,
      safeCurrentIndex,
      stride,
      swipeEnabled,
      width,
    ],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(swipeEnabled && itemCount > 1)
        .activeOffsetX([-ACTIVE_OFFSET, ACTIVE_OFFSET])
        .failOffsetY([-ACTIVE_OFFSET, ACTIVE_OFFSET])
        .onUpdate((event) => {
          if (!isTransitioning.value) {
            dragOffset.value = getResistedDragOffset(
              event.translationX,
              animatedCurrentIndex.value,
              itemCount,
            );
          }
        })
        .onEnd((event) => {
          if (isTransitioning.value) {
            return;
          }

          if (shouldCommitCarouselSwipe(event.translationX, event.velocityX, width)) {
            const direction = getCarouselSwipeDirection(event.translationX, event.velocityX);
            const nextIndex = getBoundedCarouselIndex(
              animatedCurrentIndex.value,
              direction,
              itemCount,
            );

            if (nextIndex === animatedCurrentIndex.value) {
              dragOffset.value = withSpring(0, SLIDE_SPRING);
              return;
            }

            isTransitioning.value = true;
            dragOffset.value = withTiming(
              -direction * stride,
              {
                duration: FLY_DURATION_MS,
                easing: Easing.out(Easing.cubic),
                reduceMotion: ReduceMotion.System,
              },
              (finished) => {
                if (!finished) {
                  isTransitioning.value = false;
                  return;
                }

                runOnJS(completeMove)(nextIndex);
              },
            );
            return;
          }

          dragOffset.value = withSpring(0, SLIDE_SPRING);
        }),
    [
      animatedCurrentIndex,
      completeMove,
      dragOffset,
      isTransitioning,
      itemCount,
      stride,
      swipeEnabled,
      width,
    ],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (!swipeEnabled) {
        return;
      }

      if (event.nativeEvent.actionName === 'increment') {
        move(1);
      } else if (event.nativeEvent.actionName === 'decrement') {
        move(-1);
      }
    },
    [move, swipeEnabled],
  );

  if (!currentItem) {
    return null;
  }

  return (
    <View onLayout={handleLayout} style={styles.viewport}>
      <View
        accessible
        accessibilityActions={
          swipeEnabled
            ? [
                { label: 'Next item', name: 'increment' },
                { label: 'Previous item', name: 'decrement' },
              ]
            : []
        }
        accessibilityHint={
          swipeEnabled && itemCount > 1 ? 'Swipe left or right to browse items.' : undefined
        }
        accessibilityLabel={itemLabel ? `${accessibilityLabel}, ${itemLabel}` : accessibilityLabel}
        accessibilityRole="adjustable"
        accessibilityState={{ disabled: !swipeEnabled }}
        onAccessibilityAction={handleAccessibilityAction}
        style={styles.accessibilityControl}
      />
      <GestureDetector gesture={panGesture}>
        <View style={styles.slideViewport}>
          <View style={styles.track}>
            {items.map((item, index) => (
              <CarouselItem
                currentIndex={animatedCurrentIndex}
                dragOffset={dragOffset}
                key={keyExtractor(item, index)}
                stride={stride}
                width={width}
              >
                {renderItem(item, index)}
              </CarouselItem>
            ))}
          </View>
        </View>
      </GestureDetector>
      {itemCount > 1 ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.indicator}
        >
          {items.map((item, index) => (
            <View
              key={`indicator-${keyExtractor(item, index)}`}
              style={[
                styles.indicatorMark,
                index === safeCurrentIndex && styles.indicatorMarkActive,
                {
                  backgroundColor:
                    index === safeCurrentIndex ? indicatorActiveColor : indicatorInactiveColor,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
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
    height: '100%',
    flexShrink: 0,
    paddingBottom: 8,
  },
  indicator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 4,
    paddingTop: 8,
  },
  indicatorMark: {
    backgroundColor: museBuddyColors.sky,
    borderRadius: 2,
    height: 4,
    width: 18,
  },
  indicatorMarkActive: {
    backgroundColor: museBuddyColors.wildflower,
    height: 6,
    opacity: 1,
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    gap: ITEM_GAP,
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  slideViewport: {
    flex: 1,
    overflow: 'hidden',
  },
});
