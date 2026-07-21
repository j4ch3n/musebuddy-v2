import { describe, expect, it } from 'vitest';

import { getRhythmAttackDotPosition } from './rhythm-attack-geometry';

describe('rhythm attack dot geometry', () => {
  const gridWidth = 332;
  const stepDurationMs = 100;

  it('centers an ideal attack beneath its corresponding cell', () => {
    const position = getRhythmAttackDotPosition({
      attackOffsetMs: 5 * stepDurationMs,
      gridWidth,
      stepDurationMs,
    });

    expect(position.barIndex).toBe(0);
    expect(position.targetCenterX).toBe(113.5);
    expect(position.left).toBe(108.5);
    expect(position.left).toBe(position.targetCenterX - 5);
  });

  it('interpolates early and late attacks continuously between cell centers', () => {
    const position = getRhythmAttackDotPosition({
      attackOffsetMs: 550,
      gridWidth,
      stepDurationMs,
    });

    expect(position.targetCenterX).toBe(124);
    expect(position.left).toBe(119);
  });

  it('resolves the second card and clamps the final half-step inside the grid', () => {
    const position = getRhythmAttackDotPosition({
      attackOffsetMs: 3_150,
      gridWidth,
      stepDurationMs,
    });

    expect(position.barIndex).toBe(1);
    expect(position.left).toBe(322);
  });
});
