import { StyleSheet, View } from 'react-native';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import type { RhythmStep } from './types';

const BEAT_BAND_INDEXES = [0, 1, 2, 3] as const;

type RhythmBarViewerProps = {
  currentStepIndex: number | null;
  muted?: boolean;
  steps: readonly RhythmStep[];
};

export function RhythmBarViewer({ currentStepIndex, steps, muted = false }: RhythmBarViewerProps) {
  return (
    <View
      accessibilityLabel="Rhythm bar with thirty-two thirty-second-note steps"
      style={styles.container}
    >
      <View style={styles.lane}>
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
              isCurrent={currentStepIndex === stepIndex}
              key={stepIndex}
              muted={muted}
              step={step}
              stepIndex={stepIndex}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function StepPart({
  isCurrent,
  muted,
  step,
  stepIndex,
}: {
  isCurrent: boolean;
  muted: boolean;
  step: RhythmStep;
  stepIndex: number;
}) {
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
          muted && styles.mutedStepBar,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  beatBand: { backgroundColor: museBuddyColors.mist, flex: 1 },
  beatBandAlternate: { backgroundColor: museBuddyColors.skyWash },
  beatBands: { bottom: 0, flexDirection: 'row', left: 0, position: 'absolute', right: 0, top: 0 },
  container: { minHeight: 62, paddingVertical: 2 },
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
  holdStepBar: { backgroundColor: museBuddyColors.rhythmHold, height: 12, width: '90%' },
  lane: {
    borderCurve: 'continuous',
    borderRadius: museBuddyRadii.medium,
    height: 58,
    overflow: 'hidden',
    position: 'relative',
  },
  mutedStepBar: { backgroundColor: museBuddyColors.notationGray },
  restStepBar: { backgroundColor: museBuddyColors.rhythmRest, height: 6, width: '55%' },
  stepBar: {
    borderColor: museBuddyColors.frame,
    borderCurve: 'continuous',
    borderRadius: 3,
    borderWidth: 2,
    zIndex: 1,
  },
  stepGrid: { alignItems: 'flex-end', flexDirection: 'row', height: '100%' },
  stepPart: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    minWidth: 0,
    paddingBottom: 5,
    position: 'relative',
  },
  strongStepBar: { backgroundColor: museBuddyColors.rhythmStrong, height: 44, width: '80%' },
  weakStepBar: { backgroundColor: museBuddyColors.rhythmWeak, height: 30, width: '66%' },
});
