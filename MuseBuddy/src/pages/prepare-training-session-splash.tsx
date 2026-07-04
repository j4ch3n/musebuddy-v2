import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
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
      <FlashCard>
        <View style={styles.content}>
          {phase === 'error' ? (
            <>
              <Text style={styles.title}>Could not prepare training</Text>
              <Text style={styles.message}>{errorMessage}</Text>
            </>
          ) : (
            <>
              <ActivityIndicator color={museBuddyColors.accentPurple} size="large" />
              <Text style={styles.title}>{"Loading today's session"}</Text>
              <Text style={styles.message}>Model and training material are getting ready.</Text>
            </>
          )}
        </View>
      </FlashCard>
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
    color: museBuddyColors.ink,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
  title: {
    backgroundColor: museBuddyColors.surfaceMuted,
    borderRadius: museBuddyRadii.round,
    color: museBuddyColors.ink,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 7,
    textAlign: 'center',
  },
});
