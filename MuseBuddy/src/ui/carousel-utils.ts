export type CarouselDirection = -1 | 1;

const DISTANCE_THRESHOLD_RATIO = 0.24;
const VELOCITY_THRESHOLD = 650;

export function getBoundedCarouselIndex(
  currentIndex: number,
  direction: CarouselDirection,
  itemCount: number,
) {
  'worklet';

  if (itemCount <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(currentIndex + direction, itemCount - 1));
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
