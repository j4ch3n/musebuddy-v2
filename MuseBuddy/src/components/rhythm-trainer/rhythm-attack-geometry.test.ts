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
    expect(position.targetCenterX).toBe(57.0625);
    expect(position.left).toBe(52.0625);
    expect(position.left).toBe(position.targetCenterX - 5);
  });

  it('interpolates early and late attacks continuously between cell centers', () => {
    const position = getRhythmAttackDotPosition({
      attackOffsetMs: 550,
      gridWidth,
      stepDurationMs,
    });

    expect(position.targetCenterX).toBe(62.25);
    expect(position.left).toBe(57.25);
  });

  it('starts a new lane at the center of its first step', () => {
    const position = getRhythmAttackDotPosition({
      attackOffsetMs: 3_200,
      gridWidth,
      stepDurationMs,
    });

    expect(position.barIndex).toBe(1);
    expect(position.targetCenterX).toBe(5.1875);
    expect(position.left).toBe(0.1875);
  });

  it('resolves the second card and clamps the final half-step inside the grid', () => {
    const position = getRhythmAttackDotPosition({
      attackOffsetMs: 6_350,
      gridWidth,
      stepDurationMs,
    });

    expect(position.barIndex).toBe(1);
    expect(position.left).toBe(322);
  });
});
