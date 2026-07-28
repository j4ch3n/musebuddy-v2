import { ATTACK_DOT_DIAMETER_PX, ATTACK_DOT_RADIUS_PX, STEPS_PER_BAR } from './constants';

export type RhythmAttackDotPosition = {
  barIndex: number;
  left: number;
  targetCenterX: number;
};

export function getRhythmAttackDotPosition({
  attackOffsetMs,
  gridWidth,
  stepDurationMs,
}: {
  attackOffsetMs: number;
  gridWidth: number;
  stepDurationMs: number;
}): RhythmAttackDotPosition {
  const cellWidth = gridWidth / STEPS_PER_BAR;
  const centerForStep = (stepIndex: number) => cellWidth / 2 + stepIndex * cellWidth;
  const barDurationMs = STEPS_PER_BAR * stepDurationMs;
  const barIndex = Math.floor(attackOffsetMs / barDurationMs);
  const localOffsetMs = attackOffsetMs - barIndex * barDurationMs;
  const continuousStep = localOffsetMs / stepDurationMs;
  const lowerStep = Math.floor(continuousStep);
  const fraction = continuousStep - lowerStep;
  const targetCenterX =
    lowerStep < STEPS_PER_BAR - 1
      ? centerForStep(lowerStep) + fraction * cellWidth
      : centerForStep(STEPS_PER_BAR - 1) +
        fraction * (gridWidth - centerForStep(STEPS_PER_BAR - 1));
  const left = clamp(targetCenterX - ATTACK_DOT_RADIUS_PX, 0, gridWidth - ATTACK_DOT_DIAMETER_PX);

  return { barIndex, left, targetCenterX };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
