import type { Meta, StoryObj } from '@storybook/react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import { buildChordDisplay } from '@/music-theory';
import { FlashCard } from '@/ui';

import { ChordHandShapeCue } from './chord-hand-shape-cue';

function displayFor(
  idName: string,
  root: string,
  tones: Parameters<typeof buildChordDisplay>[0]['tones'],
) {
  return buildChordDisplay({
    displayTokens: [{ type: 'root', value: root }],
    idName,
    normalizedSymbol: root,
    root,
    tones,
  });
}

const major = displayFor('c-major', 'C', [
  { degree: '1', finger: 5, hand: 'left', isBass: true, pitch: 'C', pitchClass: 0 },
  { degree: '3', finger: 3, hand: 'right', isBass: false, pitch: 'E', pitchClass: 4 },
  { degree: '5', finger: 1, hand: 'left', isBass: false, pitch: 'G', pitchClass: 7 },
]);
const firstInversion = displayFor('c-major-over-e', 'C', [
  { degree: '1', finger: 3, hand: 'left', isBass: false, pitch: 'C', pitchClass: 0 },
  { degree: '3', finger: 5, hand: 'left', isBass: true, pitch: 'E', pitchClass: 4 },
  { degree: '5', finger: 1, hand: 'left', isBass: false, pitch: 'G', pitchClass: 7 },
]);
const extended = displayFor('c-dominant-thirteen', 'C', [
  { degree: '1', finger: 1, hand: 'left', isBass: true, pitch: 'C', pitchClass: 0 },
  { degree: '3', finger: 1, hand: 'right', isBass: false, pitch: 'E', pitchClass: 4 },
  { degree: '5', finger: 5, hand: 'left', isBass: false, pitch: 'G', pitchClass: 7 },
  { degree: 'b7', finger: 2, hand: 'right', isBass: false, pitch: 'Bb', pitchClass: 10 },
  { degree: '9', finger: 3, hand: 'right', isBass: false, pitch: 'D', pitchClass: 2 },
  { degree: '13', finger: 4, hand: 'right', isBass: false, pitch: 'A', pitchClass: 9 },
]);
const contrastingCues = displayFor('c-sharp-major-seventh', 'C#', [
  { degree: '1', finger: 5, hand: 'left', isBass: true, pitch: 'C#', pitchClass: 1 },
  { degree: '3', finger: 1, hand: 'right', isBass: false, pitch: 'E#', pitchClass: 5 },
  { degree: '5', finger: 1, hand: 'left', isBass: false, pitch: 'G#', pitchClass: 8 },
  { degree: '7', finger: 5, hand: 'right', isBass: false, pitch: 'B#', pitchClass: 0 },
]);

const meta = {
  title: 'Components/ChordLearning/ChordHandShapeCue',
  component: ChordHandShapeCue,
  args: { notes: major.notes },
  render: (args) => (
    <FlashCard
      heightMode="daily-training"
      shadowColor={museBuddyColors.sky}
      sideA={<ChordHandShapeCue {...args} />}
    />
  ),
} satisfies Meta<typeof ChordHandShapeCue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RootPosition: Story = {};
export const FirstInversion: Story = { args: { notes: firstInversion.notes } };
export const ExtendedTwoHandVoicing: Story = { args: { notes: extended.notes } };
export const ContrastingHandCues: Story = { args: { notes: contrastingCues.notes } };
export const LeftHandOnly: Story = { args: { hand: 'left' } };
export const RightHandOnly: Story = { args: { hand: 'right' } };
export const NoKeys: Story = { args: { hand: 'right', notes: [] } };
export const MissingInstruction: Story = {
  args: { notes: major.notes.map((note) => ({ ...note, finger: null, hand: null })) },
};
