import { describe, expect, it } from 'vitest';

import { createDegreeWatermarkSlots } from './degree-watermark-layout';

describe('createDegreeWatermarkSlots', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('creates a safe circular layout for %i degree(s)', (count) => {
    const slots = createDegreeWatermarkSlots(count, () => 0.5);

    expect(slots).toHaveLength(count);
    for (const slot of slots) {
      const left = percentageValue(slot.left);
      const top = percentageValue(slot.top);
      const rotation = degreeValue(slot.rotation);

      expect(left).toBeGreaterThanOrEqual(9);
      expect(left).toBeLessThanOrEqual(91);
      expect(top).toBeGreaterThanOrEqual(9);
      expect(top).toBeLessThanOrEqual(91);
      expect(rotation).toBeGreaterThanOrEqual(-10);
      expect(rotation).toBeLessThanOrEqual(10);
      expect(slot.opacity).toBeGreaterThanOrEqual(0.14);
      expect(slot.opacity).toBeLessThanOrEqual(0.22);
    }
  });

  it('caps layouts at eight degree watermarks', () => {
    expect(createDegreeWatermarkSlots(12, () => 0.5)).toHaveLength(8);
  });
});

function percentageValue(value: `${number}%`) {
  return Number.parseFloat(value);
}

function degreeValue(value: `${number}deg`) {
  return Number.parseFloat(value);
}
