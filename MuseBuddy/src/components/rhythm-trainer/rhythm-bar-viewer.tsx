import { StyleSheet, View } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import type { RhythmStep } from './types';

type RhythmBarViewerProps = {
  currentStepIndex: number | null;
  isPlayingBar: boolean;
  steps: readonly RhythmStep[];
};

export function RhythmBarViewer({ currentStepIndex, isPlayingBar, steps }: RhythmBarViewerProps) {
  return (
    <View
      accessibilityLabel="Rhythm bar with sixteen sixteenth-note steps"
      style={[styles.container, isPlayingBar && styles.containerPlaying]}
    >
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
  );
}

type StepPartProps = {
  isCurrent: boolean;
  step: RhythmStep;
  stepIndex: number;
};

function StepPart({ isCurrent, step, stepIndex }: StepPartProps) {
  const label = step === null ? 'rest' : step === 's' ? 'strong beat' : 'weak beat';

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
          step === null && styles.restStepBar,
          isCurrent && styles.currentStepBar,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: museBuddyColors.surface,
    borderColor: museBuddyColors.ink,
    borderCurve: 'continuous',
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 6px 0 ${museBuddyColors.ink}`,
    minHeight: 82,
    padding: 12,
  },
  containerPlaying: {
    backgroundColor: '#ffffff',
  },
  stepGrid: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    height: 54,
  },
  stepPart: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.surfaceMuted,
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
    backgroundColor: '#ffffff',
    borderWidth: 3,
  },
  stepBar: {
    borderColor: museBuddyColors.ink,
    borderRadius: 4,
    borderWidth: 2,
    width: '64%',
  },
  strongStepBar: {
    backgroundColor: museBuddyColors.accentRed,
    height: 40,
  },
  weakStepBar: {
    backgroundColor: museBuddyColors.accentBlue,
    height: 26,
  },
  restStepBar: {
    backgroundColor: 'transparent',
    borderColor: museBuddyColors.ink,
    height: 8,
    opacity: 0.35,
  },
  currentStepBar: {
    backgroundColor: museBuddyColors.primary,
  },
});
