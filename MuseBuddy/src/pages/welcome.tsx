import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { Button } from '@/ui';

import { TrainingScreenShell } from './training-screen-shell';

const prepareTrainingSessionHref = '/prepare-training-session-splash' as Href;

export function WelcomePage() {
  const router = useRouter();

  return (
    <TrainingScreenShell
      brandMark
      eyebrow="Daily exercise"
      footer={
        <Button
          label="Start today's training"
          onPress={() => {
            router.push(prepareTrainingSessionHref);
          }}
        />
      }
      subtitle="A focused piano improvisation practice session for today."
      title="MuseBuddy"
    >
      <View style={styles.pathPanel}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.pathRoute}
        >
          {[0, 1, 2, 3, 4].map((step) => (
            <View
              key={step}
              style={[styles.pathNode, step === 0 ? styles.pathNodeCurrent : null]}
            />
          ))}
        </View>
        <Text style={styles.pathTitle}>Practice path</Text>
        <Text style={styles.pathBody}>
          {
            "Preview today's pattern, learn its chords, train each hand's rhythm, then review the full score."
          }
        </Text>
      </View>
    </TrainingScreenShell>
  );
}

const styles = StyleSheet.create({
  pathBody: {
    color: museBuddyColors.pine,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 25,
  },
  pathNode: {
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: 8,
    borderWidth: 3,
    height: 16,
    width: 16,
  },
  pathNodeCurrent: {
    backgroundColor: museBuddyColors.wildflower,
  },
  pathPanel: {
    backgroundColor: museBuddyColors.petal,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    gap: 12,
    padding: 20,
    boxShadow: `0 4px 0 ${museBuddyColors.frame}`,
  },
  pathRoute: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pathTitle: {
    color: museBuddyColors.pine,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
});
