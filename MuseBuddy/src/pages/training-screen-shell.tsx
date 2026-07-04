import type { ReactNode } from 'react';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

type TrainingStepId = 'chord' | 'rhythm' | 'jam';
type TrainingStepIconName = 'music' | 'drum' | 'magic';

type BaseTrainingScreenShellProps = {
  children: ReactNode;
  footer: ReactNode;
};

type StepTrainingScreenShellProps = BaseTrainingScreenShellProps & {
  currentStep: TrainingStepId;
  eyebrow?: never;
  subtitle?: never;
  title?: never;
};

type HeaderTrainingScreenShellProps = BaseTrainingScreenShellProps & {
  currentStep?: never;
  eyebrow: string;
  subtitle: string;
  title: string;
};

type TrainingScreenShellProps = StepTrainingScreenShellProps | HeaderTrainingScreenShellProps;

type TrainingStep = {
  accent: 'blue' | 'green' | 'purple';
  iconName: TrainingStepIconName;
  id: TrainingStepId;
  label: string;
};

const trainingSteps: TrainingStep[] = [
  {
    accent: 'blue',
    iconName: 'music',
    id: 'chord',
    label: 'Chord',
  },
  {
    accent: 'green',
    iconName: 'drum',
    id: 'rhythm',
    label: 'Rhythm',
  },
  {
    accent: 'purple',
    iconName: 'magic',
    id: 'jam',
    label: 'Jam',
  },
];

export function TrainingScreenShell(props: TrainingScreenShellProps) {
  const { children, footer } = props;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {props.currentStep !== undefined ? (
          <TrainingStepIndicator currentStep={props.currentStep} />
        ) : (
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{props.eyebrow}</Text>
            <Text style={styles.title}>{props.title}</Text>
            <Text style={styles.subtitle}>{props.subtitle}</Text>
          </View>
        )}

        <View style={styles.body}>{children}</View>

        <View style={styles.footer}>{footer}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TrainingStepIndicator({ currentStep }: { currentStep: TrainingStepId }) {
  const currentStepIndex = trainingSteps.findIndex((step) => step.id === currentStep);

  return (
    <View accessibilityRole="summary" style={styles.stepIndicator}>
      {trainingSteps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentStepIndex;

        return (
          <View
            accessibilityLabel={`${step.label} step${isActive ? ', current' : ''}`}
            key={step.id}
            style={[
              styles.stepItem,
              isActive && styles.stepItemActive,
              isComplete && styles.stepItemComplete,
            ]}
          >
            <FontAwesome5
              color={museBuddyColors.ink}
              iconStyle="solid"
              name={step.iconName}
              size={22}
            />
            <Text style={styles.stepLabel}>{step.label}</Text>
            <View style={[styles.stepAccent, accentStyles[step.accent]]} />
          </View>
        );
      })}
    </View>
  );
}

type PrimaryTrainingButtonProps = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'success';
};

export function PrimaryTrainingButton({
  label,
  onPress,
  tone = 'primary',
}: PrimaryTrainingButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'success' && styles.successButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

type PlaceholderPanelProps = {
  accent?: 'blue' | 'green' | 'purple';
  body: string;
  title: string;
};

export function PlaceholderPanel({ accent = 'blue', body, title }: PlaceholderPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={[styles.accentMark, accentStyles[accent]]} />
      <Text style={styles.panelTitle}>{title}</Text>
      <Text style={styles.panelBody}>{body}</Text>
    </View>
  );
}

const accentStyles = StyleSheet.create({
  blue: {
    backgroundColor: museBuddyColors.accentBlue,
  },
  green: {
    backgroundColor: museBuddyColors.accentGreen,
  },
  purple: {
    backgroundColor: museBuddyColors.accentPurple,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: museBuddyColors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  header: {
    gap: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 10,
  },
  stepItem: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.surface,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 4px 0 ${museBuddyColors.ink}`,
    flex: 1,
    gap: 6,
    minHeight: 86,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingTop: 12,
  },
  stepItemActive: {
    backgroundColor: museBuddyColors.active,
    boxShadow: `0 6px 0 ${museBuddyColors.ink}`,
    transform: [{ translateY: -2 }],
  },
  stepItemComplete: {
    backgroundColor: museBuddyColors.surfaceMuted,
  },
  stepLabel: {
    color: museBuddyColors.ink,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
  },
  stepAccent: {
    borderColor: museBuddyColors.ink,
    borderTopWidth: museBuddyBorders.bold,
    bottom: 0,
    height: 10,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  eyebrow: {
    color: museBuddyColors.accentPurple,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: museBuddyColors.ink,
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 44,
  },
  subtitle: {
    color: museBuddyColors.ink,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    maxWidth: 480,
  },
  body: {
    flex: 1,
    gap: 18,
  },
  footer: {
    paddingTop: 8,
  },
  button: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.primary,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 6px 0 ${museBuddyColors.ink}`,
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  successButton: {
    backgroundColor: museBuddyColors.accentGreen,
  },
  buttonPressed: {
    boxShadow: `0 2px 0 ${museBuddyColors.ink}`,
    transform: [{ translateY: 4 }],
  },
  buttonLabel: {
    color: museBuddyColors.ink,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  panel: {
    backgroundColor: museBuddyColors.surface,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.large,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 8px 0 ${museBuddyColors.ink}`,
    gap: 12,
    overflow: 'hidden',
    padding: 22,
  },
  accentMark: {
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.small,
    borderWidth: museBuddyBorders.bold,
    height: 22,
    width: 92,
  },
  panelTitle: {
    color: museBuddyColors.ink,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  panelBody: {
    color: museBuddyColors.ink,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 25,
  },
});
