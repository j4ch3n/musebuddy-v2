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

const cMajor = displayFor('c-major', 'C', [
  { degree: '1', finger: 5, hand: 'left', isBass: true, pitch: 'C', pitchClass: 0 },
  { degree: '3', finger: 3, hand: 'right', isBass: false, pitch: 'E', pitchClass: 4 },
  { degree: '5', finger: 1, hand: 'left', isBass: false, pitch: 'G', pitchClass: 7 },
]);
const cMajorOverE = displayFor('c-major-over-e', 'C', [
  { degree: '1', finger: 3, hand: 'left', isBass: false, pitch: 'C', pitchClass: 0 },
  { degree: '3', finger: 5, hand: 'left', isBass: true, pitch: 'E', pitchClass: 4 },
  { degree: '5', finger: 1, hand: 'left', isBass: false, pitch: 'G', pitchClass: 7 },
]);
const cThirteen = displayFor('c-dominant-thirteen', 'C', [
  { degree: '1', finger: 1, hand: 'left', isBass: true, pitch: 'C', pitchClass: 0 },
  { degree: '3', finger: 1, hand: 'right', isBass: false, pitch: 'E', pitchClass: 4 },
  { degree: '5', finger: 5, hand: 'left', isBass: false, pitch: 'G', pitchClass: 7 },
  { degree: 'b7', finger: 2, hand: 'right', isBass: false, pitch: 'Bb', pitchClass: 10 },
  { degree: '9', finger: 3, hand: 'right', isBass: false, pitch: 'D', pitchClass: 2 },
  { degree: '13', finger: 4, hand: 'right', isBass: false, pitch: 'A', pitchClass: 9 },
]);
const cSharpMajorSeventh = displayFor('c-sharp-major-seventh', 'C#', [
  { degree: '1', finger: 5, hand: 'left', isBass: true, pitch: 'C#', pitchClass: 1 },
  { degree: '3', finger: 1, hand: 'right', isBass: false, pitch: 'E#', pitchClass: 5 },
  { degree: '5', finger: 1, hand: 'left', isBass: false, pitch: 'G#', pitchClass: 8 },
  { degree: '7', finger: 5, hand: 'right', isBass: false, pitch: 'B#', pitchClass: 0 },
]);

const cuePresets = {
  'C major': cMajor.notes,
  'C/E': cMajorOverE.notes,
  C13: cThirteen.notes,
  'C#maj7': cSharpMajorSeventh.notes,
} as const;

type CuePreset = keyof typeof cuePresets;
type ChordHandShapeCueStoryArgs = {
  align: 'center' | 'end' | 'start';
  hand: 'left' | 'right';
  preset: CuePreset;
  size: 'default' | 'large';
};

const meta = {
  title: 'Components/ChordLearning/ChordHandShapeCue',
  args: { align: 'center', hand: 'left', preset: 'C major', size: 'default' },
  argTypes: {
    align: { control: 'select', options: ['center', 'start', 'end'] },
    hand: { control: 'select', options: ['left', 'right'] },
    preset: { control: 'select', options: Object.keys(cuePresets) as CuePreset[] },
    size: { control: 'select', options: ['default', 'large'] },
  },
  render: ({ align, hand, preset, size }: ChordHandShapeCueStoryArgs) => (
    <FlashCard
      heightMode="daily-training"
      shadowColor={museBuddyColors.sky}
      sideA={<ChordHandShapeCue align={align} hand={hand} notes={cuePresets[preset]} size={size} />}
    />
  ),
} satisfies Meta<ChordHandShapeCueStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
