import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';
import { buildSoundFontPlaybackConfiguration } from '@/music-theory/sound-font-playback';
import { Button } from '@/ui';

import { play, stop, SoundFontPlayerError } from '../../../modules/sound-font-player';

type SessionGoalPlayButtonProps = {
  keyArrangement: TrainingSessionKeyArrangement | null;
};

export function SessionGoalPlayButton({ keyArrangement }: SessionGoalPlayButtonProps) {
  const { learningConfig } = useTrainingSession();
  const previousBpmRef = useRef(learningConfig.bpm);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const configuration = useMemo(
    () =>
      keyArrangement
        ? buildSoundFontPlaybackConfiguration(keyArrangement, learningConfig.bpm)
        : null,
    [keyArrangement, learningConfig.bpm],
  );
  const isDisabled = !configuration || configuration.tracks.length === 0;

  useEffect(
    () => () => {
      void stop();
    },
    [],
  );

  useEffect(() => {
    const didChangeBpm = previousBpmRef.current !== learningConfig.bpm;
    previousBpmRef.current = learningConfig.bpm;

    if (!didChangeBpm || !isPlaying || !configuration) {
      return;
    }

    void play(configuration).catch((error: unknown) => {
      setIsPlaying(false);
      setErrorMessage(messageFor(error));
    });
  }, [configuration, isPlaying, learningConfig.bpm]);

  async function handlePress() {
    setErrorMessage('');

    if (isPlaying) {
      setIsPlaying(false);
      await stop();
      return;
    }

    if (!configuration || configuration.tracks.length === 0) {
      return;
    }

    try {
      await play(configuration);
      setIsPlaying(true);
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
