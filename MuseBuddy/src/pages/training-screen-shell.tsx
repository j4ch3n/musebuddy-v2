import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
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
  brandMark?: boolean;
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
      {props.currentStep !== undefined ? (
        <View style={styles.trainingHeader}>
          <DailyProgressNavigator currentStep={props.currentStep} />
          <BpmControl onChange={setBpm} value={learningConfig.bpm} />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
      >
        {props.currentStep !== undefined ? null : (
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{props.eyebrow}</Text>
            {props.brandMark ? (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.brandMark}
              />
            ) : null}
            {props.brandMark ? (
              <View style={styles.titleSlab}>
                <Text style={[styles.title, styles.titleOnSlab]}>{props.title}</Text>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={styles.dailySticker}
                />
              </View>
            ) : (
              <Text style={styles.title}>{props.title}</Text>
            )}
            <Text style={styles.subtitle}>{props.subtitle}</Text>
          </View>
        )}

        <View style={styles.body}>{children}</View>
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: museBuddyColors.mist,
    flex: 1,
  },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: 24,
    paddingBottom: 20,
    paddingLeft: 15,
    paddingRight: 9,
    paddingTop: 28,
  },
  trainingHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    zIndex: 20,
  },
  header: {
    gap: 8,
  },
  brandMark: {
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.frame,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 20,
    borderWidth: 3,
    height: 22,
    marginBottom: 4,
    transform: [{ rotate: '-4deg' }],
    width: 72,
  },
  dailySticker: {
    backgroundColor: museBuddyColors.sun,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.small,
    borderWidth: 2,
    height: 18,
    position: 'absolute',
    right: -7,
    top: -9,
    transform: [{ rotate: '8deg' }],
    width: 34,
  },
  eyebrow: {
    color: museBuddyColors.pine,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: museBuddyColors.pine,
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 44,
  },
  titleSlab: {
    alignSelf: 'flex-start',
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: 3,
    boxShadow: `6px 6px 0 ${museBuddyColors.frame}`,
    marginBottom: 5,
    padding: 9,
    position: 'relative',
    transform: [{ skewY: '-6deg' }],
  },
  titleOnSlab: { color: museBuddyColors.mist, transform: [{ skewY: '6deg' }] },
  subtitle: {
    color: museBuddyColors.pine,
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
    backgroundColor: museBuddyColors.mist,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
});
