import { useEffect } from 'react';
import Lucide from '@react-native-vector-icons/lucide';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { museBuddyColors } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import { Button, FlashCard } from '@/ui';

import { TrainingScreenShell } from './training-screen-shell';

const sessionGoalHref = '/session-goal' as Href;

export function PrepareTrainingSessionSplashPage() {
  const router = useRouter();
  const { errorMessage, phase, prepareTrainingSession, session } = useTrainingSession();

  useEffect(() => {
    if (phase === 'idle') {
      void prepareTrainingSession();
    }
  }, [phase, prepareTrainingSession]);

  useEffect(() => {
    if (phase === 'ready' && session) {
      router.replace(sessionGoalHref);
    }
  }, [phase, router, session]);

  return (
    <TrainingScreenShell
      eyebrow="Daily exercise"
      footer={
        phase === 'error' ? (
          <Button label="Try again" onPress={() => void prepareTrainingSession()} />
        ) : (
          <View style={styles.footerSpacer} />
        )
      }
      subtitle="Preparing today's piano practice."
      title="MuseBuddy"
    >
      <FlashCard
        shadowColor={museBuddyColors.cobalt}
        sideA={
          <View style={styles.content}>
            {phase === 'error' ? (
              <>
                <Lucide color={museBuddyColors.pine} name="triangle-alert" size={36} />
                <Text style={styles.title}>Could not prepare training</Text>
                <Text style={styles.message}>{errorMessage}</Text>
              </>
            ) : (
              <>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={styles.loadingScore}
                >
                  {[0.72, 1, 0.84, 0.58].map((width, index) => (
                    <View key={index} style={[styles.loadingLine, { width: `${width * 100}%` }]} />
                  ))}
                  <View style={styles.scanBar} />
                </View>
                <Text style={styles.title}>{"Loading today's session"}</Text>
                <Text style={styles.message}>Model and training material are getting ready.</Text>
              </>
            )}
          </View>
        }
      />
    </TrainingScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: 14,
    minHeight: 180,
    justifyContent: 'center',
  },
  footerSpacer: {
    minHeight: 56,
  },
  message: {
    color: museBuddyColors.pine,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
  loadingLine: {
    backgroundColor: museBuddyColors.sky,
    borderColor: museBuddyColors.frame,
    borderRadius: 3,
    borderWidth: 1,
    height: 6,
  },
  scanBar: {
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.frame,
    borderWidth: 2,
    height: 9,
    marginTop: 4,
    width: '58%',
  },
  loadingScore: {
    gap: 8,
    width: '72%',
  },
  title: {
    color: museBuddyColors.pine,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    textAlign: 'center',
  },
});
