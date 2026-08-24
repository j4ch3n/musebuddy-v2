import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import { ATTACK_DOT_DIAMETER_PX, ATTACK_DOT_RADIUS_PX } from './constants';
import { getRhythmAttackDotPosition } from './rhythm-attack-geometry';
import type { RhythmAttackDot, RhythmStep } from './types';

const BEAT_BAND_INDEXES = [0, 1, 2, 3] as const;

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
        style={styles.lane}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.beatBands}
        >
          {BEAT_BAND_INDEXES.map((beatIndex) => (
            <View
              key={beatIndex}
              style={[styles.beatBand, beatIndex % 2 === 0 && styles.beatBandAlternate]}
            />
          ))}
        </View>
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
        accessibilityLabel="Recorded rhythm taps"
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
        <>
          <View pointerEvents="none" style={styles.currentPointer} />
          <View pointerEvents="none" style={styles.currentScanLine} />
        </>
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
    minHeight: 82,
    paddingVertical: 2,
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
    backgroundColor: museBuddyColors.cobaltWash,
    borderColor: museBuddyColors.cobaltInk,
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
  currentPointer: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 5,
    borderRightColor: 'transparent',
    borderRightWidth: 5,
    borderTopColor: museBuddyColors.rhythmCurrent,
    borderTopWidth: 8,
    height: 0,
    left: '50%',
    marginLeft: -5,
    position: 'absolute',
    top: 0,
    width: 0,
    zIndex: 2,
  },
  currentScanLine: {
    backgroundColor: museBuddyColors.rhythmCurrent,
    bottom: 0,
    left: '50%',
    marginLeft: -1,
    opacity: 0.9,
    position: 'absolute',
    top: 8,
    width: 2,
    zIndex: 2,
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
    backgroundColor: museBuddyColors.cobaltInk,
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
