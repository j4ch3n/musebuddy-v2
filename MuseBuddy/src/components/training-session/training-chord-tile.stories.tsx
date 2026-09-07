import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import { buildChordDisplay } from '@/music-theory';

import { TrainingChordTile } from './training-chord-tile';

const meta = {
  title: 'Components/TrainingChordTile',
  component: TrainingChordTile,
  args: {
    chord: buildChordDisplay({
      displayTokens: [
        { teachingRole: 'anchor', type: 'root', value: 'D' },
        { teachingRole: 'quality', type: 'quality', value: 'm' },
        { teachingRole: 'color', type: 'addition', value: 'add9' },
      ],
      idName: 'd-minor-add9',
      normalizedSymbol: 'Dmadd9',
      root: 'D',
      tones: [
        { degree: '1', pitch: 'D', pitchClass: 2 },
        { degree: '3', pitch: 'F', pitchClass: 5 },
      ],
    }),
    degree: 'vi',
  },
} satisfies Meta<typeof TrainingChordTile>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <View style={styles.canvas}>
      <TrainingChordTile {...args} />
    </View>
  ),
};

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: museBuddyColors.paper,
    height: 140,
    padding: 12,
    width: '100%',
  },
});
