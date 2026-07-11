import { describe, expect, it } from 'vitest';

import {
  getBoundedCarouselIndex,
  getCarouselSwipeDirection,
  shouldCommitCarouselSwipe,
} from './carousel-utils';

describe('getBoundedCarouselIndex', () => {
  it('moves in either direction', () => {
    expect(getBoundedCarouselIndex(1, 1, 3)).toBe(2);
    expect(getBoundedCarouselIndex(1, -1, 3)).toBe(0);
  });

  it('stops at both ends', () => {
    expect(getBoundedCarouselIndex(2, 1, 3)).toBe(2);
    expect(getBoundedCarouselIndex(0, -1, 3)).toBe(0);
  });

  it('returns zero for an empty carousel', () => {
    expect(getBoundedCarouselIndex(0, 1, 0)).toBe(0);
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
