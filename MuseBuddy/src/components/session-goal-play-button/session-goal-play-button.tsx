import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';
import { buildSoundFontPlaybackConfiguration } from '@/music-theory/sound-font-playback';
import { Button } from '@/ui';

import { play, stop, SoundFontPlayerError } from '../../../modules/sound-font-player';

type SessionGoalPlayButtonProps = {
  keyArrangement: TrainingSessionKeyArrangement | null;
};

export function SessionGoalPlayButton({ keyArrangement }: SessionGoalPlayButtonProps) {
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const configuration = useMemo(
    () => (keyArrangement ? buildSoundFontPlaybackConfiguration(keyArrangement) : null),
    [keyArrangement],
  );
  const isDisabled = !configuration || configuration.notes.length === 0;

  useEffect(
    () => () => {
      clearPlaybackTimeout(playbackTimeoutRef);
      void stop();
    },
    [],
  );

  async function handlePress() {
    setErrorMessage('');

    if (isPlaying) {
      clearPlaybackTimeout(playbackTimeoutRef);
      setIsPlaying(false);
      await stop();
      return;
    }

    if (!configuration || configuration.notes.length === 0) {
      return;
    }

    try {
      await play(configuration);
      setIsPlaying(true);

      const playbackDurationSeconds = Math.max(
        ...configuration.notes.map((note) => note.startTimeSeconds + note.durationSeconds),
      );
      playbackTimeoutRef.current = setTimeout(
        () => {
          setIsPlaying(false);
          playbackTimeoutRef.current = null;
        },
        playbackDurationSeconds * 1_000 + 150,
      );
    } catch (error) {
      setIsPlaying(false);
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
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
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

function clearPlaybackTimeout(playbackTimeoutRef: {
  current: ReturnType<typeof setTimeout> | null;
}) {
  if (!playbackTimeoutRef.current) {
    return;
  }

  clearTimeout(playbackTimeoutRef.current);
  playbackTimeoutRef.current = null;
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
});
