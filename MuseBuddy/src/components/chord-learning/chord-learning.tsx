import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';

import { ChordKeyboardCard } from './chord-keyboard-card';
import { ChordName } from './chord-name';
import { useChordListenRecognition } from './use-chord-listen-recognition';

type ChordLearningProps = {
  display: ChordDisplay;
  isActive: boolean;
};

export function ChordLearning({ display, isActive }: ChordLearningProps) {
  const displays = useMemo(() => [display], [display]);
  const { errorMessage, liveKeys } = useChordListenRecognition({ displays, enabled: isActive });

  return (
    <View style={styles.container}>
      <Text accessibilityLabel={`Chord name ${display.friendlyName}`} style={styles.friendlyName}>
        {display.friendlyName}
      </Text>
      <View style={styles.learningContent}>
        <ChordName display={display} size="large" />
        <ChordKeyboardCard display={display} errorMessage={errorMessage} liveKeys={liveKeys} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
  },
  learningContent: {
    alignItems: 'stretch',
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  friendlyName: {
    color: museBuddyColors.pine,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    textAlign: 'left',
  },
});
