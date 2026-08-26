import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { Lucide } from '@react-native-vector-icons/lucide';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { StyleSheet, Text, View } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { type PhraseStage } from '@/contexts/training-session-context';
import { Button, FlashCard } from '@/ui';

const STAGES: readonly PhraseStage[] = ['ideas', 'chords', 'rhythms'];

const stageDetails: Record<
  PhraseStage,
  { backgroundColor: string; label: string; shadowColor: string }
> = {
  ideas: {
    backgroundColor: museBuddyColors.sunWash,
    label: 'Ideas',
    shadowColor: museBuddyColors.sun,
  },
  chords: {
    backgroundColor: museBuddyColors.skyWash,
    label: 'Chords',
    shadowColor: museBuddyColors.sky,
  },
  rhythms: {
    backgroundColor: museBuddyColors.leafWash,
    label: 'Rhythms',
    shadowColor: museBuddyColors.leaf,
  },
};

type PhraseStageCardProps = {
  selectedStage: PhraseStage;
  onStageChange: (stage: PhraseStage) => void;
};

export function PhraseStageCard({ selectedStage, onStageChange }: PhraseStageCardProps) {
  return (
    <FlashCard
      accessibilityLabel="Phrase learning stage"
      shadowColor={stageDetails[selectedStage].shadowColor}
      sideA={
        <View style={styles.content}>
          <View accessibilityRole="tablist" style={styles.tabs}>
            {STAGES.map((stage) => (
              <StageTab
                isSelected={stage === selectedStage}
                key={stage}
                onPress={() => onStageChange(stage)}
                stage={stage}
              />
            ))}
          </View>
          <View style={styles.mainContent} />
          <View style={styles.playControl}>
            <Button
              accessibilityLabel={`Play ${stageDetails[selectedStage].label} practice`}
              backgroundColor={museBuddyColors.wildflower}
              frameColor={museBuddyColors.pine}
              icon={<Lucide color={museBuddyColors.mist} name="play" size={20} />}
              label="Play"
              onPress={() => {}}
              shadowColor={museBuddyColors.pine}
              surfaceColor={museBuddyColors.mist}
            />
          </View>
        </View>
      }
      style={styles.card}
    />
  );
}

function StageTab({
  isSelected,
  onPress,
  stage,
}: {
  isSelected: boolean;
  onPress: () => void;
  stage: PhraseStage;
}) {
  const { backgroundColor, label } = stageDetails[stage];
  const iconColor = isSelected ? museBuddyColors.wildflower : museBuddyColors.pine;

  return (
    <Button
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      backgroundColor={backgroundColor}
      frameColor={museBuddyColors.pine}
      onPress={onPress}
      shadowColor={museBuddyColors.pine}
      shadowEnabled={false}
      style={styles.tab}
      surfaceColor={museBuddyColors.pine}
    >
      <View style={styles.tabContent}>
        {stage === 'ideas' ? (
          <Lucide color={iconColor} name="lightbulb" size={isSelected ? 22 : 18} />
        ) : null}
        {stage === 'chords' ? (
          <MaterialDesignIcons color={iconColor} name="piano" size={isSelected ? 22 : 19} />
        ) : null}
        {stage === 'rhythms' ? (
          <FontAwesome5
            color={iconColor}
            iconStyle="solid"
            name="drum"
            size={isSelected ? 22 : 17}
          />
        ) : null}
        <Text style={[styles.tabLabel, isSelected && styles.selectedTabLabel]}>{label}</Text>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 0 },
  content: { flex: 1, minHeight: 0 },
  mainContent: { flex: 1 },
  playControl: { alignSelf: 'center', width: '100%' },
  selectedTabLabel: { fontWeight: '900' },
  tab: {
    borderRadius: museBuddyRadii.small,
    borderWidth: museBuddyBorders.standard,
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  tabContent: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'center' },
  tabLabel: { color: museBuddyColors.pine, fontSize: 13, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 6 },
});
