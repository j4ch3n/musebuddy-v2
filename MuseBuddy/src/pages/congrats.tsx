import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import { Button, GraphicSheet } from '@/ui';

import { TrainingScreenShell } from './training-screen-shell';

export function CongratsPage() {
  const router = useRouter();

  return (
    <TrainingScreenShell
      eyebrow="Session complete"
      footer={
        <Button
          label="Back to home"
          onPress={() => {
            router.dismissTo('/');
          }}
          tone="success"
        />
      }
      subtitle="Today's complete piano pattern practice is finished."
      title="Nice work"
    >
      <View style={styles.completion}>
        <View style={styles.rewardField}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.burstOne}
          />
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.burstTwo}
          />
          <Lucide color={museBuddyColors.pine} name="music-2" size={52} />
          <View style={styles.check}>
            <Lucide color={museBuddyColors.mist} name="check" size={18} />
          </View>
        </View>
        <GraphicSheet tone="mist">
          <Text style={styles.completionTitle}>{"You finished today's practice"}</Text>
          <Text style={styles.completionBody}>
            Your full piano pattern is complete. Keep this warm-up feeling for the next session.
          </Text>
        </GraphicSheet>
      </View>
    </TrainingScreenShell>
  );
}

const styles = StyleSheet.create({
  check: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.pine,
    borderRadius: 16,
    bottom: -2,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: -8,
    width: 32,
  },
  completion: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  completionBody: {
    color: museBuddyColors.pine,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 25,
    textAlign: 'center',
  },
  completionTitle: {
    color: museBuddyColors.pine,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    textAlign: 'center',
  },
  rewardField: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.sun,
    borderColor: museBuddyColors.frame,
    borderRadius: 44,
    borderWidth: 3,
    height: 88,
    justifyContent: 'center',
    position: 'relative',
    width: 88,
  },
  burstOne: {
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.frame,
    borderWidth: 3,
    height: 54,
    left: -22,
    position: 'absolute',
    top: 10,
    transform: [{ rotate: '-28deg' }],
    width: 54,
  },
  burstTwo: {
    backgroundColor: museBuddyColors.sun,
    borderColor: museBuddyColors.frame,
    borderWidth: 3,
    bottom: -16,
    height: 42,
    position: 'absolute',
    right: -20,
    transform: [{ rotate: '27deg' }],
    width: 42,
  },
});
