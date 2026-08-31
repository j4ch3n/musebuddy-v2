import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ChordKeyboardCard, ChordName, ChordToneLegend } from '@/components/chord-learning';
import { RhythmViewer } from '@/components/rhythm-trainer';
import { museBuddyColors } from '@/constants/design-tokens';
import type { TrainingDetailTab } from '@/contexts/training-session-context';
import type { PreparedTrainingBar } from '@/music-theory';
import { FlashCard, MusicViewFlip } from '@/ui';

import { BarDetailsTabGroup } from './bar-details-tab-group';

type BarDetailsProps = {
  bar: PreparedTrainingBar;
  currentStepIndex: number | null;
  onTabChange: (tab: TrainingDetailTab) => void;
  selectedTab: TrainingDetailTab;
};

export function BarDetails({ bar, currentStepIndex, onTabChange, selectedTab }: BarDetailsProps) {
  const selectedTabId =
    selectedTab.kind === 'chord'
      ? `chord-${selectedTab.chordIndex}`
      : `rhythm-${selectedTab.staff}`;
  const tabs = [
    ...bar.chordDisplays.map((chord, chordIndex) => ({
      id: `chord-${chordIndex}`,
      label: chord.symbol,
    })),
    {
      accessibilityLabel: 'Treble rhythm',
      id: 'rhythm-treble',
      label: (
        <MaterialDesignIcons color={museBuddyColors.pine} name="music-clef-treble" size={25} />
      ),
    },
    {
      accessibilityLabel: 'Bass rhythm',
      id: 'rhythm-bass',
      label: <MaterialDesignIcons color={museBuddyColors.pine} name="music-clef-bass" size={25} />,
    },
  ];

  function handleTabSelect(tabId: string) {
    if (tabId === 'rhythm-treble') {
      onTabChange({ kind: 'rhythm', staff: 'treble' });
      return;
    }
    if (tabId === 'rhythm-bass') {
      onTabChange({ kind: 'rhythm', staff: 'bass' });
      return;
    }

    const chordIndex = Number(tabId.replace('chord-', ''));
    if (Number.isInteger(chordIndex) && chordIndex >= 0 && chordIndex < bar.chordDisplays.length) {
      onTabChange({ chordIndex, kind: 'chord' });
    }
  }

  return (
    <FlashCard
      accessibilityLabel="Bar details"
      padded={false}
      shadowColor={selectedTab.kind === 'chord' ? museBuddyColors.sky : museBuddyColors.leaf}
      sideA={
        <View style={styles.content}>
          <BarDetailsTabGroup onSelect={handleTabSelect} selectedId={selectedTabId} tabs={tabs} />
          {selectedTab.kind === 'chord' ? (
            <ChordDetail
              chord={bar.chordDisplays[selectedTab.chordIndex] ?? bar.chordDisplays[0]}
            />
          ) : (
            <RhythmDetail bar={bar} currentStepIndex={currentStepIndex} staff={selectedTab.staff} />
          )}
        </View>
      }
      style={styles.card}
    />
  );
}

function ChordDetail({
  chord,
}: {
  chord: PreparedTrainingBar['chordDisplays'][number] | undefined;
}) {
  if (!chord) return null;
  return (
    <View style={styles.chordContent}>
      <View style={styles.chordHeading}>
        <ChordName display={chord} />
        <Text style={styles.friendlyName}>{chord.friendlyName}</Text>
      </View>
      <MusicViewFlip
        keyboard={<ChordKeyboardCard display={chord} displayMode="keyboard" />}
        notation={<ChordKeyboardCard display={chord} displayMode="notation" />}
        style={styles.chordStudy}
      />
      <ChordToneLegend />
    </View>
  );
}

function RhythmDetail({
  bar,
  currentStepIndex,
  staff,
}: {
  bar: PreparedTrainingBar;
  currentStepIndex: number | null;
  staff: 'bass' | 'treble';
}) {
  return (
    <View style={styles.rhythmContent}>
      <RhythmViewer
        clef={staff}
        currentStepIndex={currentStepIndex}
        pattern={bar.rhythms[staff].pattern}
        showLegend={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 0 },
  chordContent: { flex: 1, gap: 8, minHeight: 0, paddingTop: 4 },
  chordHeading: { alignItems: 'center' },
  chordStudy: { flex: 1, minHeight: 200 },
  content: { flex: 1, minHeight: 0, paddingBottom: 18, paddingHorizontal: 18, paddingTop: 8 },
  friendlyName: { color: museBuddyColors.pine, fontSize: 14, fontWeight: '800' },
  rhythmContent: { flex: 1, minHeight: 0, paddingTop: 8 },
});
