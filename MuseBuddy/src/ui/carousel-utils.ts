export type CarouselDirection = -1 | 1;

const DISTANCE_THRESHOLD_RATIO = 0.24;
const VELOCITY_THRESHOLD = 650;

export function buildInitialCarouselSlots(itemCount: number) {
  return Array.from({ length: itemCount }, (_, index) =>
    itemCount > 1 && index === itemCount - 1 ? -1 : index,
  );
}

export function rotateCarouselSlots(
  slots: readonly number[],
  direction: CarouselDirection,
  itemCount: number,
) {
  'worklet';

  if (itemCount <= 1) {
    return [...slots];
  }

  return slots.map((slot) => {
    const nextSlot = slot - direction;

    if (nextSlot < -1) {
      return itemCount - 2;
    }

    if (nextSlot > itemCount - 2) {
      return -1;
    }

    return nextSlot;
  });
}

export function getWrappedCarouselIndex(
  currentIndex: number,
  direction: CarouselDirection,
  itemCount: number,
) {
  if (itemCount <= 0) {
    return 0;
  }

  return (currentIndex + direction + itemCount) % itemCount;
}

export function shouldCommitCarouselSwipe(translationX: number, velocityX: number, width: number) {
  'worklet';

  return (
    (width > 0 && Math.abs(translationX) >= width * DISTANCE_THRESHOLD_RATIO) ||
    Math.abs(velocityX) >= VELOCITY_THRESHOLD
  );
}

export function getCarouselSwipeDirection(
  translationX: number,
  velocityX: number,
): CarouselDirection {
  'worklet';

  const movement = Math.abs(velocityX) >= VELOCITY_THRESHOLD ? velocityX : translationX;
  return movement < 0 ? 1 : -1;
}
