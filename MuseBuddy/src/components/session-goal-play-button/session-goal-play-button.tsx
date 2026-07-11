import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';
import { buildSoundFontPlaybackConfiguration } from '@/music-theory/sound-font-playback';
import { Button } from '@/ui';

import {
  addLeadInFinishListener,
  addTickListener,
  play,
  stop,
  SoundFontPlayerError,
} from '../../../modules/sound-font-player';

type SessionGoalPlayButtonProps = {
  keyArrangement: TrainingSessionKeyArrangement | null;
};

type PlaybackSignalState = {
  barCount: number;
  beatCount: number;
  didFinishLeadIn: boolean;
};

const initialSignalState: PlaybackSignalState = {
  barCount: 0,
  beatCount: 0,
  didFinishLeadIn: false,
};

export function SessionGoalPlayButton({ keyArrangement }: SessionGoalPlayButtonProps) {
  const { learningConfig } = useTrainingSession();
  const previousBpmRef = useRef(learningConfig.bpm);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [signalState, setSignalState] = useState<PlaybackSignalState>(initialSignalState);
  const configuration = useMemo(
    () =>
      keyArrangement
        ? buildSoundFontPlaybackConfiguration(keyArrangement, learningConfig.bpm)
        : null,
    [keyArrangement, learningConfig.bpm],
  );
  const isDisabled = !configuration || configuration.tracks.length === 0;

  const resetSignalState = useCallback(() => {
    setSignalState(initialSignalState);
  }, []);

  useEffect(
    () => () => {
      void stop();
    },
    [],
  );

  useEffect(() => {
    const leadInSubscription = addLeadInFinishListener(() => {
      setSignalState((current) => ({
        ...current,
        didFinishLeadIn: true,
      }));
    });
    const tickSubscription = addTickListener((event) => {
      setSignalState((current) => ({
        ...current,
        barCount: event.event === 'bar' ? current.barCount + 1 : current.barCount,
        beatCount: event.event === 'beat' ? current.beatCount + 1 : current.beatCount,
      }));
    });

    return () => {
      leadInSubscription.remove();
      tickSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const didChangeBpm = previousBpmRef.current !== learningConfig.bpm;
    previousBpmRef.current = learningConfig.bpm;

    if (!didChangeBpm || !isPlaying || !configuration) {
      return;
    }

    resetSignalState();
    void play(configuration).catch((error: unknown) => {
      setIsPlaying(false);
      resetSignalState();
      setErrorMessage(messageFor(error));
    });
  }, [configuration, isPlaying, learningConfig.bpm, resetSignalState]);

  async function handlePress() {
    setErrorMessage('');

    if (isPlaying) {
      setIsPlaying(false);
      resetSignalState();
      await stop();
      return;
    }

    if (!configuration || configuration.tracks.length === 0) {
      return;
    }

    try {
      resetSignalState();
      await play(configuration);
      setIsPlaying(true);
    } catch (error) {
      setIsPlaying(false);
      resetSignalState();
      setErrorMessage(messageFor(error));
    }
  }

  return (
    <View style={styles.container}>
      <Button
        disabled={isDisabled}
        label={isPlaying ? 'Stop' : 'Play'}
        onPress={() => void handlePress()}
        tone={isPlaying ? 'danger' : 'success'}
      />
      <PlaybackSignalIndicator signalState={signalState} />
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );
}

function PlaybackSignalIndicator({ signalState }: { signalState: PlaybackSignalState }) {
  return (
    <View style={styles.signalContainer}>
      <SignalValue label="Lead" value={signalState.didFinishLeadIn ? 'Done' : '-'} />
      <SignalValue label="Beat" value={signalState.beatCount} />
      <SignalValue label="Bar" value={signalState.barCount} />
    </View>
  );
}

function SignalValue({ label, value }: { label: string; value: number | 'Done' | '-' }) {
  return (
    <View style={styles.signalItem}>
      <Text style={styles.signalLabel}>{label}</Text>
      <Text style={styles.signalValue}>{value}</Text>
    </View>
  );
}

function messageFor(error: unknown) {
  if (error instanceof SoundFontPlayerError) {
    if (__DEV__ && error.nativeMessage) {
      return `${error.message} ${error.nativeMessage}`;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Piano playback failed.';
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  errorText: {
    color: museBuddyColors.accentRed,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
  signalContainer: {
    alignSelf: 'center',
    backgroundColor: museBuddyColors.surface,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.bold,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  signalItem: {
    alignItems: 'center',
    minWidth: 48,
  },
  signalLabel: {
    color: museBuddyColors.ink,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
    textTransform: 'uppercase',
  },
  signalValue: {
    color: museBuddyColors.accentBlue,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    lineHeight: 18,
  },
});
