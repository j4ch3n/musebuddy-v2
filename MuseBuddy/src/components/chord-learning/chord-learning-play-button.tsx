import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import { Button } from '@/ui';
import type { SoundFontPlaybackConfiguration } from '@modules/sound-font-player';
import { play, stop, SoundFontPlayerError } from '@modules/sound-font-player';

type ChordLearningPlayButtonProps = {
  configuration: SoundFontPlaybackConfiguration | null;
  playLabel: string;
};

export function ChordLearningPlayButton({
  configuration,
  playLabel,
}: ChordLearningPlayButtonProps) {
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const isDisabled = !configuration || configuration.tracks.length === 0;

  useEffect(
    () => () => {
      void stop();
    },
    [],
  );

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
        label={isPlaying ? 'Stop' : playLabel}
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
    gap: 8,
  },
  errorText: {
    color: museBuddyColors.accentRed,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
});
