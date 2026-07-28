import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import { ATTACK_DOT_DIAMETER_PX, ATTACK_DOT_RADIUS_PX } from './constants';
import { getRhythmAttackDotPosition } from './rhythm-attack-geometry';
import type { RhythmAttackDot, RhythmStep } from './types';

const BEAT_NUMBERS = [1, 2, 3, 4] as const;

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
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.beatLabels}
      >
        {BEAT_NUMBERS.map((beatNumber) => (
          <Text key={beatNumber} style={styles.beatLabel}>
            {beatNumber}
          </Text>
        ))}
      </View>
      <View
        onLayout={(event) => {
          setGridWidth(event.nativeEvent.layout.width);
        }}
        style={styles.lane}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.beatBands}
        >
          {BEAT_NUMBERS.map((beatNumber, beatIndex) => (
            <View
              key={beatNumber}
              style={[styles.beatBand, beatIndex % 2 === 0 && styles.beatBandAlternate]}
            />
          ))}
        </View>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.baseline}
        />
        <View style={styles.stepGrid}>
          {steps.map((step, stepIndex) => (
            <StepPart
              key={stepIndex}
              isCurrent={currentStepIndex === stepIndex}
              step={step}
              stepIndex={stepIndex}
            />
          ))}
        </View>
      </View>
      <View
        accessibilityLabel="Detected piano attacks"
        style={[styles.markerRow, { width: gridWidth }]}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.markerTrack}
        />
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
    <View accessibilityLabel={`Step ${stepIndex + 1}: ${label}`} style={styles.stepPart}>
      {isCurrent ? <View pointerEvents="none" style={styles.stepPartCurrent} /> : null}
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
    minHeight: 96,
    paddingVertical: 2,
  },
  beatLabels: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  beatLabel: {
    color: museBuddyColors.ink,
    flex: 1,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    lineHeight: 14,
    opacity: 0.72,
    textAlign: 'center',
  },
  lane: {
    borderCurve: 'continuous',
    borderRadius: museBuddyRadii.medium,
    height: 58,
    overflow: 'hidden',
    position: 'relative',
  },
  beatBands: {
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  beatBand: {
    backgroundColor: museBuddyColors.surface,
    flex: 1,
  },
  beatBandAlternate: {
    backgroundColor: museBuddyColors.surfaceMuted,
  },
  baseline: {
    backgroundColor: museBuddyColors.ink,
    bottom: 4,
    height: 2,
    left: 0,
    opacity: 0.2,
    position: 'absolute',
    right: 0,
  },
  stepGrid: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: '100%',
  },
  markerRow: {
    height: ATTACK_DOT_DIAMETER_PX,
    marginTop: 6,
    position: 'relative',
  },
  markerTrack: {
    backgroundColor: museBuddyColors.surfaceMuted,
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
    top: ATTACK_DOT_RADIUS_PX - 1,
  },
  attackDot: {
    borderColor: museBuddyColors.ink,
    borderRadius: ATTACK_DOT_RADIUS_PX,
    borderWidth: 2,
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
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    minWidth: 0,
    paddingBottom: 5,
    position: 'relative',
  },
  stepPartCurrent: {
    backgroundColor: museBuddyColors.active,
    bottom: 0,
    left: 0,
    opacity: 0.48,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  stepBar: {
    borderCurve: 'continuous',
    borderRadius: 3,
    width: '70%',
    zIndex: 1,
  },
  strongStepBar: {
    backgroundColor: museBuddyColors.accentPurple,
    height: 44,
  },
  unmatchedAttackDot: {
    backgroundColor: museBuddyColors.accentRed,
  },
  weakStepBar: {
    backgroundColor: museBuddyColors.accentBlue,
    height: 30,
  },
  holdStepBar: {
    backgroundColor: museBuddyColors.accentGreen,
    height: 12,
    opacity: 0.78,
  },
  restStepBar: {
    backgroundColor: museBuddyColors.ink,
    height: 4,
    opacity: 0.28,
  },
});
