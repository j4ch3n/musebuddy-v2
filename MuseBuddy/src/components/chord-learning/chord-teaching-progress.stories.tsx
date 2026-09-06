import type { Meta, StoryObj } from '@storybook/react-native';

import type { ChordDisplay, ChordDisplayNote } from '@/music-theory';
import { FlashCard } from '@/ui';
import { museBuddyColors } from '@/constants/design-tokens';

import { ChordInformation } from './chord-information';
import type { ChordToneStage } from './chord-tone-stage';

function note(
  degree: ChordDisplayNote['degree'],
  text: string,
  pitchClass: ChordDisplayNote['pitchClass'],
  teachingRole: NonNullable<ChordDisplayNote['teachingRole']>,
  options: Pick<ChordDisplayNote, 'isBass' | 'isRoot' | 'voicingRole'> = {
    isBass: false,
    isRoot: false,
    voicingRole: 'required',
  },
): ChordDisplayNote {
  const [letter, accidental = ''] = text;
  const octave = Number(text.at(-1));
  return {
    accidental,
    degree,
    isBass: options.isBass ?? false,
    isRoot: options.isRoot ?? false,
    letter: letter as ChordDisplayNote['letter'],
    midi: 60 + pitchClass,
    octave,
    pitchClass,
    teachingRole,
    text,
    vexflowKey: `${letter.toLowerCase()}${accidental}/${octave}`,
    voicingRole: options.voicingRole ?? 'required',
  };
}

const cMajor: ChordDisplay = {
  commonNotations: ['C'],
  friendlyName: 'C major',
  idName: 'c-major',
  normalizedSymbol: 'C',
  notes: [
    note('1', 'C4', 0, 'anchor', { isBass: true, isRoot: true, voicingRole: 'required' }),
    note('3', 'E4', 4, 'quality'),
    note('5', 'G4', 7, 'voicing'),
  ],
  symbol: 'C',
  tokens: [{ teachingRole: 'anchor', text: 'C', type: 'root' }],
};

const fSus4: ChordDisplay = {
  commonNotations: ['Fsus4'],
  friendlyName: 'F suspended fourth',
  idName: 'f-suspended-fourth',
  normalizedSymbol: 'Fsus4',
  notes: [
    note('1', 'F4', 5, 'anchor', { isBass: true, isRoot: true, voicingRole: 'required' }),
    note('4', 'Bb4', 10, 'quality'),
    note('5', 'C5', 0, 'voicing'),
  ],
  symbol: 'Fsus4',
  tokens: [
    { teachingRole: 'anchor', text: 'F', type: 'root' },
    { teachingRole: 'quality', text: 'sus4', type: 'quality' },
  ],
};

const bb7b9: ChordDisplay = {
  commonNotations: ['Bb7(b9)'],
  friendlyName: 'B flat dominant seven flat nine',
  idName: 'b-flat-dominant-seven-flat-nine',
  normalizedSymbol: 'Bb7(b9)',
  notes: [
    note('1', 'Bb3', 10, 'anchor', { isBass: true, isRoot: true, voicingRole: 'required' }),
    note('3', 'D4', 2, 'quality'),
    note('b7', 'Ab4', 8, 'guide'),
    note('b9', 'Cb5', 11, 'color'),
    note('5', 'F4', 5, 'voicing', { isBass: false, isRoot: false, voicingRole: 'optional' }),
  ],
  symbol: 'Bb7(b9)',
  tokens: [
    { teachingRole: 'anchor', text: 'Bb', type: 'root' },
    { teachingRole: 'guide', text: '7', type: 'extension' },
    { teachingRole: null, text: '(', type: 'separator' },
    { teachingRole: 'color', text: 'b9', type: 'alteration' },
    { teachingRole: null, text: ')', type: 'separator' },
  ],
};

const chordDisplays = {
  'B♭7(♭9)': bb7b9,
  'C major': cMajor,
  Fsus4: fSus4,
} as const;

type ChordPreset = keyof typeof chordDisplays;
type ChordTeachingProgressStoryArgs = {
  chord: ChordPreset;
  stage: ChordToneStage;
};

const meta = {
  title: 'Components/ChordLearning/TeachingProgress',
  args: { chord: 'C major', stage: 'anchor' },
  argTypes: {
    chord: { control: 'select', options: ['C major', 'Fsus4', 'B♭7(♭9)'] satisfies ChordPreset[] },
    stage: {
      control: 'select',
      options: ['anchor', 'quality', 'guide', 'color', 'complete'] satisfies ChordToneStage[],
    },
  },
  render: ({ chord, stage }: ChordTeachingProgressStoryArgs) => (
    <FlashCard
      heightMode="daily-training"
      shadowColor={museBuddyColors.sky}
      sideA={
        <ChordInformation display={chordDisplays[chord]} onPlayPress={noop} toneStage={stage} />
      }
      surface="supporting"
    />
  ),
} satisfies Meta<ChordTeachingProgressStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Progress: Story = {};

function noop() {}
