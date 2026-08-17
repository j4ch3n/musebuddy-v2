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
          >
            {dot.matched ? (
              <View style={styles.matchedAttackCenter} />
            ) : (
              <>
                <View style={[styles.attackCrossLine, styles.attackCrossLineForward]} />
                <View style={[styles.attackCrossLine, styles.attackCrossLineBackward]} />
              </>
            )}
          </View>
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
      {isCurrent ? (
        <View pointerEvents="none" style={styles.stepPartCurrent}>
          <View style={styles.currentNotch} />
        </View>
      ) : null}
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
    color: museBuddyColors.pine,
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
    backgroundColor: museBuddyColors.mist,
    flex: 1,
  },
  beatBandAlternate: {
    backgroundColor: museBuddyColors.skyWash,
  },
  baseline: {
    backgroundColor: museBuddyColors.pine,
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
    backgroundColor: museBuddyColors.frame,
    opacity: 0.24,
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
    top: ATTACK_DOT_RADIUS_PX - 1,
  },
  attackDot: {
    borderColor: museBuddyColors.frame,
    borderRadius: ATTACK_DOT_RADIUS_PX,
    borderWidth: 2,
    height: ATTACK_DOT_DIAMETER_PX,
    position: 'absolute',
    top: 0,
    width: ATTACK_DOT_DIAMETER_PX,
  },
  matchedAttackDot: {
    backgroundColor: museBuddyColors.rhythmCorrect,
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
    backgroundColor: museBuddyColors.petal,
    borderColor: museBuddyColors.rhythmCurrent,
    borderWidth: 3,
    bottom: 0,
    left: 0,
    opacity: 0.82,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  stepBar: {
    borderCurve: 'continuous',
    borderRadius: 3,
    borderColor: museBuddyColors.frame,
    borderWidth: 2,
    zIndex: 1,
  },
  strongStepBar: {
    backgroundColor: museBuddyColors.rhythmStrong,
    height: 44,
    width: '80%',
  },
  unmatchedAttackDot: {
    backgroundColor: museBuddyColors.coralWash,
    borderColor: museBuddyColors.coralInk,
  },
  weakStepBar: {
    backgroundColor: museBuddyColors.rhythmWeak,
    height: 30,
    width: '66%',
  },
  holdStepBar: {
    backgroundColor: museBuddyColors.rhythmHold,
    height: 12,
    width: '90%',
  },
  restStepBar: {
    backgroundColor: museBuddyColors.rhythmRest,
    height: 6,
    width: '55%',
  },
  currentNotch: {
    backgroundColor: museBuddyColors.rhythmCurrent,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    height: 7,
    left: '25%',
    position: 'absolute',
    right: '25%',
    top: 0,
  },
  matchedAttackCenter: {
    alignSelf: 'center',
    backgroundColor: museBuddyColors.frame,
    borderRadius: 3,
    height: 6,
    marginTop: 3,
    width: 6,
  },
  attackCrossLine: {
    backgroundColor: museBuddyColors.coralInk,
    height: 2,
    left: 2,
    position: 'absolute',
    top: 5,
    width: 9,
  },
  attackCrossLineForward: {
    transform: [{ rotate: '45deg' }],
  },
  attackCrossLineBackward: {
    transform: [{ rotate: '-45deg' }],
  },
});
