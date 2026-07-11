import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { museBuddyColors } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import { BpmControl, DailyProgressNavigator, type DailyProgressNavigatorStep } from '@/ui';

type TrainingStepId = DailyProgressNavigatorStep;

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

export function TrainingScreenShell(props: TrainingScreenShellProps) {
  const { children, footer } = props;
  const { learningConfig, setBpm } = useTrainingSession();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {props.currentStep !== undefined ? (
          <View style={styles.trainingHeader}>
            <DailyProgressNavigator currentStep={props.currentStep} />
            <BpmControl onChange={setBpm} value={learningConfig.bpm} />
          </View>
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
  trainingHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    zIndex: 10,
  },
  header: {
    gap: 8,
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
});
