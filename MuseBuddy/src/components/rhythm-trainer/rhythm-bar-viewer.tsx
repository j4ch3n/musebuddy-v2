import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import { ATTACK_DOT_DIAMETER_PX, ATTACK_DOT_RADIUS_PX, STEP_GRID_GAP_PX } from './constants';
import { getRhythmAttackDotPosition } from './rhythm-attack-geometry';
import type { RhythmAttackDot, RhythmStep } from './types';

type RhythmBarViewerProps = {
  attackDots?: readonly RhythmAttackDot[];
  barIndex?: number;
  currentStepIndex: number | null;
  stepDurationMs?: number;
  steps: readonly RhythmStep[];
};

export function RhythmBarViewer({
  attackDots = [],
  barIndex = 0,
  currentStepIndex,
  stepDurationMs = 1,
  steps,
}: RhythmBarViewerProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const positionedDots =
    gridWidth > 0
      ? attackDots.flatMap((dot) => {
          const position = getRhythmAttackDotPosition({
            attackOffsetMs: dot.attackOffsetMs,
            gridWidth,
            stepDurationMs,
          });
          return position.barIndex === barIndex ? [{ ...dot, left: position.left }] : [];
        })
      : [];

  return (
    <View
      accessibilityLabel="Rhythm bar with thirty-two thirty-second-note steps"
      style={styles.container}
    >
      <View
        onLayout={(event) => {
          setGridWidth(event.nativeEvent.layout.width);
        }}
        style={styles.stepGrid}
      >
        {steps.map((step, stepIndex) => (
          <StepPart
            key={stepIndex}
            isCurrent={currentStepIndex === stepIndex}
            step={step}
            stepIndex={stepIndex}
          />
        ))}
      </View>
      <View
        accessibilityLabel="Detected piano attacks"
        style={[styles.markerRow, { width: gridWidth }]}
      >
        {positionedDots.map((dot) => (
          <View
            key={dot.id}
            style={[
              styles.attackDot,
              dot.matched ? styles.matchedAttackDot : styles.unmatchedAttackDot,
              { left: dot.left },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

type StepPartProps = {
  isCurrent: boolean;
  step: RhythmStep;
  stepIndex: number;
};

function StepPart({ isCurrent, step, stepIndex }: StepPartProps) {
  const label =
    step === null ? 'rest' : step === 's' ? 'strong beat' : step === 'w' ? 'weak beat' : 'hold';

  return (
    <View
      accessibilityLabel={`Step ${stepIndex + 1}: ${label}`}
      style={[styles.stepPart, isCurrent && styles.stepPartCurrent]}
    >
      <View
        style={[
          styles.stepBar,
          step === 's' && styles.strongStepBar,
          step === 'w' && styles.weakStepBar,
          step === 'h' && styles.holdStepBar,
          step === null && styles.restStepBar,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: museBuddyColors.white,
    borderRadius: museBuddyRadii.small,
    minHeight: 98,
    padding: 12,
  },
  stepGrid: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: STEP_GRID_GAP_PX,
    height: 54,
  },
  markerRow: {
    height: ATTACK_DOT_DIAMETER_PX,
    marginTop: 4,
    position: 'relative',
  },
  attackDot: {
    borderColor: museBuddyColors.ink,
    borderRadius: ATTACK_DOT_RADIUS_PX,
    borderWidth: 1,
    height: ATTACK_DOT_DIAMETER_PX,
    position: 'absolute',
    top: 0,
    width: ATTACK_DOT_DIAMETER_PX,
  },
  matchedAttackDot: {
    backgroundColor: museBuddyColors.accentGreen,
  },
  stepPart: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.white,
    borderColor: museBuddyColors.ink,
    borderCurve: 'continuous',
    borderRadius: museBuddyRadii.small,
    borderWidth: 2,
    flex: 1,
    height: 54,
    justifyContent: 'flex-end',
    minWidth: 0,
    overflow: 'hidden',
    paddingBottom: 4,
  },
  stepPartCurrent: {
    backgroundColor: museBuddyColors.active,
    borderWidth: 3,
  },
  stepBar: {
    borderColor: museBuddyColors.ink,
    borderRadius: 4,
    borderWidth: 2,
    width: '64%',
    zIndex: 1,
  },
  strongStepBar: {
    backgroundColor: museBuddyColors.primary,
    height: 40,
  },
  unmatchedAttackDot: {
    backgroundColor: museBuddyColors.accentRed,
  },
  weakStepBar: {
    backgroundColor: museBuddyColors.accentBlue,
    height: 26,
  },
  holdStepBar: {
    backgroundColor: museBuddyColors.accentGreen,
    height: 14,
    opacity: 0.72,
  },
  restStepBar: {
    backgroundColor: 'transparent',
    borderColor: museBuddyColors.ink,
    height: 8,
    opacity: 0.35,
  },
});
