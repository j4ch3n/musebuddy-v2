import { StyleSheet, View } from 'react-native';

import { Button } from '@/ui';

type RhythmPlayerControlsProps = {
  isPlaying: boolean;
  onRandomPattern?: () => void;
  onTogglePlayback: () => void;
};

export function RhythmPlayerControls({
  isPlaying,
  onRandomPattern,
  onTogglePlayback,
}: RhythmPlayerControlsProps) {
  return (
    <View style={styles.container}>
      <Button
        label={isPlaying ? 'Stop rhythm' : 'Play rhythm'}
        onPress={onTogglePlayback}
        tone={isPlaying ? 'danger' : 'default'}
      />

      {onRandomPattern && (
        <Button disabled={isPlaying} label="Random" onPress={onRandomPattern} primary={false} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
});
