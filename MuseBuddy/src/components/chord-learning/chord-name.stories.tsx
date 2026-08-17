import type { Meta, StoryObj } from '@storybook/react-native';

import type { ChordDisplay } from '@/music-theory';

import { ChordName } from './chord-name';

const colorfulChord: ChordDisplay = {
  commonNotations: ['Cmaj7(#11)/G'],
  friendlyName: 'C major seven sharp eleven over G',
  idName: 'c-major-seven-sharp-eleven-over-g',
  normalizedSymbol: 'Cmaj7(#11)/G',
  notes: [],
  symbol: 'Cmaj7(#11)/G',
  tokens: [
    { text: 'C', type: 'root' },
    { text: 'maj', type: 'quality' },
    { text: '7', type: 'extension' },
    { text: '(', type: 'separator' },
    { text: '#11', type: 'alteration' },
    { text: ')', type: 'separator' },
    { text: '/', type: 'separator' },
    { text: 'G', type: 'bass' },
  ],
};

const meta = {
  title: 'Components/ChordLearning/ChordName',
  component: ChordName,
  args: {
    colorized: true,
    display: colorfulChord,
    size: 'large',
  },
} satisfies Meta<typeof ChordName>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Colorized: Story = {};

export const Monochrome: Story = {
  args: {
    colorized: false,
  },
};
