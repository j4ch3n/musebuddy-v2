import { StyleSheet, Text, View } from 'react-native';

import { PlayButton } from '@/components/training-session';
import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';
import { MusicViewFlip } from '@/ui';

import { ChordKeyboardCard } from './chord-keyboard-card';
import { ChordName } from './chord-name';
import { ChordToneLegend } from './chord-role-legend';
import { type ChordToneStage, visibleChordNotes } from './chord-tone-stage';

type ChordInformationProps = {
  display: ChordDisplay;
  isPlaying?: boolean;
  onPlayPress: () => void;
  toneStage: ChordToneStage;
};

export function ChordInformation({
  display,
  isPlaying = false,
  onPlayPress,
  toneStage,
}: ChordInformationProps) {
  const visibleNotes = visibleChordNotes(display, toneStage);
  return (
    <View style={styles.content}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <ChordName display={display} />
          <Text style={styles.friendlyName}>{display.friendlyName}</Text>
        </View>
        <PlayButton isPlaying={isPlaying} onPress={onPlayPress} />
      </View>
      <MusicViewFlip
        keyboard={
          <ChordKeyboardCard
            display={display}
            displayMode="keyboard"
            showKeyHighlightLabels={false}
            visibleNotes={visibleNotes}
          />
        }
        notation={
          <ChordKeyboardCard display={display} displayMode="notation" visibleNotes={visibleNotes} />
        }
        style={styles.study}
      />
      <ChordToneLegend />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: 6, minHeight: 0 },
  friendlyName: { color: museBuddyColors.pine, fontSize: 14, fontWeight: '800' },
  heading: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  headingCopy: { alignItems: 'center', flex: 1 },
  study: { flex: 1, minHeight: 200 },
});
