import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import { buildChordDisplay } from '@/music-theory';

import { TrainingChordTile } from './training-chord-tile';

const chordPresets = {
  'Minor add 9': buildChordDisplay({
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
  'Dominant seven': buildChordDisplay({
    displayTokens: [
      { teachingRole: 'anchor', type: 'root', value: 'G' },
      { teachingRole: 'guide', type: 'extension', value: '7' },
    ],
    idName: 'g-seven',
    normalizedSymbol: 'G7',
    root: 'G',
    tones: [
      { degree: '1', pitch: 'G', pitchClass: 7 },
      { degree: '3', pitch: 'B', pitchClass: 11 },
      { degree: 'b7', pitch: 'F', pitchClass: 5 },
    ],
  }),
  'Extended C major': buildChordDisplay({
    displayTokens: [
      { teachingRole: 'anchor', type: 'root', value: 'C' },
      { teachingRole: 'quality', type: 'quality', value: 'maj' },
      { type: 'extension', value: '7' },
      { type: 'separator', value: '(' },
      { type: 'alteration', value: '#11' },
      { type: 'separator', value: ')' },
    ],
    idName: 'c-major-7-sharp-11',
    normalizedSymbol: 'Cmaj7(#11)',
    root: 'C',
    tones: [
      { degree: '1', pitch: 'C', pitchClass: 0 },
      { degree: '3', pitch: 'E', pitchClass: 4 },
    ],
  }),
};

const degreeOptions = ['I', 'ii', 'III', 'IV', 'V', 'vi', 'vii°'];

const meta = {
  title: 'Components/TrainingChordTile',
  component: TrainingChordTile,
  args: {
    chord: chordPresets['Minor add 9'],
    colorized: true,
    degree: 'vi',
    displayMode: 'full-chord',
  },
  argTypes: {
    chord: { table: { disable: true } },
    colorized: { control: 'boolean' },
    degree: {
      control: 'select',
      options: degreeOptions,
    },
    displayMode: {
      control: 'select',
      options: ['full-chord', 'root-only'],
    },
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

export const LongChordName: Story = {
  args: {
    chord: chordPresets['Extended C major'],
  },
  render: (args) => (
    <View style={styles.narrowCanvas}>
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
  narrowCanvas: {
    backgroundColor: museBuddyColors.paper,
    height: 140,
    padding: 12,
    width: 180,
  },
});
