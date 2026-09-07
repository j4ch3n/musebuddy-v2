import type { Meta, StoryObj } from '@storybook/react-native';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import { FlashCard } from '@/ui';

import { TrainingChordStageOverview } from './training-chord-stage-overview';
import { TrainingRhythmStageOverview } from './training-rhythm-stage-overview';
import { TrainingVoicingStageOverview } from './training-voicing-stage-overview';

const meta = {
  title: 'Components/TrainingStageOverview',
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function OverviewCard({ children, shadowColor }: { children: ReactNode; shadowColor: string }) {
  return (
    <FlashCard heightMode="fill" shadowColor={shadowColor} sideA={children} style={styles.card} />
  );
}

export const Chord: Story = {
  render: () => (
    <OverviewCard shadowColor={museBuddyColors.sky}>
      <TrainingChordStageOverview />
    </OverviewCard>
  ),
};

export const RhythmTreble: Story = {
  render: () => (
    <OverviewCard shadowColor={museBuddyColors.leaf}>
      <TrainingRhythmStageOverview staff="treble" />
    </OverviewCard>
  ),
};

export const RhythmBass: Story = {
  render: () => (
    <OverviewCard shadowColor={museBuddyColors.leaf}>
      <TrainingRhythmStageOverview staff="bass" />
    </OverviewCard>
  ),
};

export const Voicing: Story = {
  render: () => (
    <OverviewCard shadowColor={museBuddyColors.leaf}>
      <TrainingVoicingStageOverview />
    </OverviewCard>
  ),
};

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 0 },
});
