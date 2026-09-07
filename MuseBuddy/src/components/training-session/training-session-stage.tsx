import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PianoPatternScore } from '@/components/piano-pattern-score';
import { RhythmViewer } from '@/components/rhythm-trainer';
import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import type { PreparedTrainingSession } from '@/music-theory';
import { FlashCard, PlayButton } from '@/ui';

import { ProgressionOverview } from './progression-overview';
import type { TrainingFocus } from './training-focus';

type Props = {
  focus: TrainingFocus;
  isPlaying: boolean;
  onPlayPress: () => void;
  onRhythmStaffChange: (staff: 'bass' | 'treble') => void;
  rhythmStaff: 'bass' | 'treble';
  session: PreparedTrainingSession;
};

export function TrainingSessionStage({
  focus,
  isPlaying,
  onPlayPress,
  onRhythmStaffChange,
  rhythmStaff,
  session,
}: Props) {
  const content =
    focus === 'chords' ? (
      <ProgressionOverview
        bars={session.bars}
        focus={focus}
        isPlaying={isPlaying}
        keyLabel={session.pattern.key_signature_display}
        onPlayPress={onPlayPress}
      />
    ) : focus === 'rhythm' ? (
      <View style={styles.activity}>
        <Header isPlaying={isPlaying} onPlayPress={onPlayPress} title="Rhythm" />
        <View style={styles.staffPicker}>
          {(['treble', 'bass'] as const).map((staff) => (
            <Pressable
              accessibilityState={{ selected: rhythmStaff === staff }}
              key={staff}
              onPress={() => onRhythmStaffChange(staff)}
              style={[styles.staffButton, rhythmStaff === staff && styles.staffButtonActive]}
            >
              <Text style={styles.staffText}>{staff}</Text>
            </Pressable>
          ))}
        </View>
        <RhythmViewer
          clef={rhythmStaff}
          currentStepIndex={null}
          pattern={session.rhythms[rhythmStaff].pattern}
        />
      </View>
    ) : (
      <View style={styles.activity}>
        <Header isPlaying={isPlaying} onPlayPress={onPlayPress} title="Voicing" />
        <PianoPatternScore
          chordChanges={session.scoreChordChanges}
          currentStepIndex={null}
          measuresPerPage={4}
          score={session.score}
          surfaceColor={museBuddyColors.paper}
        />
      </View>
    );
  return (
    <FlashCard
      accessibilityLabel={`${focus} training activity`}
      heightMode="fill"
      shadowColor={focus === 'chords' ? museBuddyColors.sky : museBuddyColors.leaf}
      sideA={content}
      style={styles.card}
    />
  );
}

function Header({
  isPlaying,
  onPlayPress,
  title,
}: {
  isPlaying: boolean;
  onPlayPress: () => void;
  title: string;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <PlayButton isPlaying={isPlaying} onPress={onPlayPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  activity: { flex: 1, gap: 10, minHeight: 0 },
  card: { margin: 16 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  staffButton: { borderRadius: museBuddyRadii.medium, paddingHorizontal: 12, paddingVertical: 7 },
  staffButtonActive: { backgroundColor: museBuddyColors.leaf },
  staffPicker: {
    alignSelf: 'center',
    borderColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    flexDirection: 'row',
  },
  staffText: {
    color: museBuddyColors.pine,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  title: { color: museBuddyColors.pine, fontSize: 22, fontWeight: '900' },
});
