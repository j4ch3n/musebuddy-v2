import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TrainingSessionNavigator, type TrainingSessionRoute } from '@/components/training-session';
import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import { BpmControl } from '@/ui';

export function TrainingSessionShell({
  activeRoute,
  children,
}: {
  activeRoute: TrainingSessionRoute;
  children: ReactNode;
}) {
  const router = useRouter();
  const { learningConfig, setBpm } = useTrainingSession();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.navigator}>
          <TrainingSessionNavigator activeRoute={activeRoute} />
        </View>
        <View style={styles.headerControls}>
          <BpmControl onChange={setBpm} value={learningConfig.bpm} />
          <Pressable
            accessibilityLabel="Exit training"
            accessibilityRole="button"
            hitSlop={6}
            onPress={() =>
              Alert.alert('Quit training?', 'Your current practice will end.', [
                { text: 'Keep practicing', style: 'cancel' },
                { text: 'Quit', style: 'destructive', onPress: () => router.replace('/') },
              ])
            }
            style={({ pressed }) => [styles.exitButton, pressed && styles.exitButtonPressed]}
          >
            <Lucide color={museBuddyColors.wildflower} name="x" size={20} />
          </Pressable>
        </View>
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, minHeight: 0 },
  exitButton: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.paper,
    borderColor: museBuddyColors.wildflower,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `3px 3px 0 ${museBuddyColors.wildflower}`,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  exitButtonPressed: {
    backgroundColor: museBuddyColors.petal,
    boxShadow: `1px 1px 0 ${museBuddyColors.wildflower}`,
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  header: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    flexDirection: 'row',
    paddingBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 8,
    zIndex: 1,
  },
  headerControls: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  navigator: { flex: 1, minWidth: 0 },
  safeArea: { backgroundColor: museBuddyColors.mist, flex: 1 },
});
