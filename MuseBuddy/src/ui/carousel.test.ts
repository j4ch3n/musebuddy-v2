import { describe, expect, it } from 'vitest';

import {
  buildInitialCarouselSlots,
  getCarouselSwipeDirection,
  getWrappedCarouselIndex,
  rotateCarouselSlots,
  shouldCommitCarouselSwipe,
} from './carousel-utils';

describe('buildInitialCarouselSlots', () => {
  it('places the first item at zero and the final item before it', () => {
    expect(buildInitialCarouselSlots(4)).toEqual([0, 1, 2, -1]);
  });

  it('handles empty and single-item carousels', () => {
    expect(buildInitialCarouselSlots(0)).toEqual([]);
    expect(buildInitialCarouselSlots(1)).toEqual([0]);
  });
});

describe('rotateCarouselSlots', () => {
  it('recycles the previous slot after a forward swipe', () => {
    expect(rotateCarouselSlots([0, 1, 2, -1], 1, 4)).toEqual([-1, 0, 1, 2]);
  });

  it('recycles the final slot after a backward swipe', () => {
    expect(rotateCarouselSlots([0, 1, 2, -1], -1, 4)).toEqual([1, 2, -1, 0]);
  });

  it('keeps a single item stationary', () => {
    expect(rotateCarouselSlots([0], 1, 1)).toEqual([0]);
  });
});

describe('getWrappedCarouselIndex', () => {
  it('moves in either direction', () => {
    expect(getWrappedCarouselIndex(1, 1, 3)).toBe(2);
    expect(getWrappedCarouselIndex(1, -1, 3)).toBe(0);
  });

  it('wraps at both ends', () => {
    expect(getWrappedCarouselIndex(2, 1, 3)).toBe(0);
    expect(getWrappedCarouselIndex(0, -1, 3)).toBe(2);
  });

  it('returns zero for an empty carousel', () => {
    expect(getWrappedCarouselIndex(0, 1, 0)).toBe(0);
  });
});

describe('shouldCommitCarouselSwipe', () => {
  it('commits a drag that crosses the distance threshold', () => {
    expect(shouldCommitCarouselSwipe(-80, 0, 300)).toBe(true);
  });

  it('commits a short, fast flick', () => {
    expect(shouldCommitCarouselSwipe(20, 700, 300)).toBe(true);
  });

  it('cancels a short, slow drag', () => {
    expect(shouldCommitCarouselSwipe(20, 200, 300)).toBe(false);
  });

  it('does not treat an unmeasured width as a completed drag', () => {
    expect(shouldCommitCarouselSwipe(0, 0, 0)).toBe(false);
  });
});

describe('getCarouselSwipeDirection', () => {
  it('uses drag direction for a distance-based swipe', () => {
    expect(getCarouselSwipeDirection(-80, 100)).toBe(1);
    expect(getCarouselSwipeDirection(80, -100)).toBe(-1);
  });

  it('uses velocity direction for a fast flick', () => {
    expect(getCarouselSwipeDirection(2, -700)).toBe(1);
    expect(getCarouselSwipeDirection(-2, 700)).toBe(-1);
  });
});
