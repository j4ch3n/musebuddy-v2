import type { Meta, StoryObj } from '@storybook/react-native';

import type { TrainingSessionChord } from '@/contexts/training-session-schema';
import { buildChordDisplay } from '@/music-theory';

import { ChordLearningCard } from './chord-learning-card';
import { chordLearningStages, type ChordToneStage } from './chord-tone-stage';

const chordProfiles = {
  cMajor: {
    displayTokens: [{ teachingRole: 'anchor', type: 'root', value: 'C' }],
    idName: 'c-major',
    normalizedSymbol: 'C',
    root: 'C',
    tones: [
      {
        degree: '1',
        finger: 5,
        hand: 'left',
        isBass: true,
        pitch: 'C',
        pitchClass: 0,
        teachingRole: 'anchor',
        voicingRole: 'required',
      },
      {
        degree: '3',
        finger: 3,
        hand: 'right',
        isBass: false,
        pitch: 'E',
        pitchClass: 4,
        teachingRole: 'quality',
        voicingRole: 'required',
      },
      {
        degree: '5',
        finger: 1,
        hand: 'left',
        isBass: false,
        pitch: 'G',
        pitchClass: 7,
        teachingRole: 'voicing',
        voicingRole: 'required',
      },
    ],
  },
  dMinor7: {
    displayTokens: [
      { teachingRole: 'anchor', type: 'root', value: 'D' },
      { teachingRole: 'quality', type: 'quality', value: 'm' },
      { teachingRole: 'guide', type: 'extension', value: '7' },
    ],
    idName: 'd-minor-seventh',
    normalizedSymbol: 'Dm7',
    root: 'D',
    tones: [
      {
        degree: '1',
        finger: 5,
        hand: 'left',
        isBass: true,
        pitch: 'D',
        pitchClass: 2,
        teachingRole: 'anchor',
        voicingRole: 'required',
      },
      {
        degree: 'b3',
        finger: 1,
        hand: 'right',
        isBass: false,
        pitch: 'F',
        pitchClass: 5,
        teachingRole: 'quality',
        voicingRole: 'required',
      },
      {
        degree: '5',
        finger: 1,
        hand: 'left',
        isBass: false,
        pitch: 'A',
        pitchClass: 9,
        teachingRole: 'voicing',
        voicingRole: 'required',
      },
      {
        degree: 'b7',
        finger: 5,
        hand: 'right',
        isBass: false,
        pitch: 'C',
        pitchClass: 0,
        teachingRole: 'guide',
        voicingRole: 'required',
      },
    ],
  },
  gDominant7: {
    displayTokens: [
      { teachingRole: 'anchor', type: 'root', value: 'G' },
      { teachingRole: 'guide', type: 'extension', value: '7' },
    ],
    idName: 'g-dominant-seven',
    normalizedSymbol: 'G7',
    root: 'G',
    tones: [
      {
        degree: '1',
        finger: 5,
        hand: 'left',
        isBass: true,
        pitch: 'G',
        pitchClass: 7,
        teachingRole: 'anchor',
        voicingRole: 'required',
      },
      {
        degree: '3',
        finger: 1,
        hand: 'right',
        isBass: false,
        pitch: 'B',
        pitchClass: 11,
        teachingRole: 'quality',
        voicingRole: 'required',
      },
      {
        degree: '5',
        finger: 1,
        hand: 'left',
        isBass: false,
        pitch: 'D',
        pitchClass: 2,
        teachingRole: 'voicing',
        voicingRole: 'required',
      },
      {
        degree: 'b7',
        finger: 5,
        hand: 'right',
        isBass: false,
        pitch: 'F',
        pitchClass: 5,
        teachingRole: 'guide',
        voicingRole: 'required',
      },
    ],
  },
  fSus4: {
    displayTokens: [
      { teachingRole: 'anchor', type: 'root', value: 'F' },
      { teachingRole: 'quality', type: 'quality', value: 'sus4' },
    ],
    idName: 'f-suspended-fourth',
    normalizedSymbol: 'Fsus4',
    root: 'F',
    tones: [
      {
        degree: '1',
        finger: 5,
        hand: 'left',
        isBass: true,
        pitch: 'F',
        pitchClass: 5,
        teachingRole: 'anchor',
        voicingRole: 'required',
      },
      {
        degree: '4',
        finger: 3,
        hand: 'right',
        isBass: false,
        pitch: 'Bb',
        pitchClass: 10,
        teachingRole: 'quality',
        voicingRole: 'required',
      },
      {
        degree: '5',
        finger: 1,
        hand: 'left',
        isBass: false,
        pitch: 'C',
        pitchClass: 0,
        teachingRole: 'voicing',
        voicingRole: 'required',
      },
    ],
  },
  cDominantThirteenth: {
    displayTokens: [
      { teachingRole: 'anchor', type: 'root', value: 'C' },
      { teachingRole: 'color', type: 'extension', value: '13' },
    ],
    idName: 'c-dominant-thirteenth',
    normalizedSymbol: 'C13',
    root: 'C',
    tones: [
      {
        degree: '1',
        finger: 5,
        hand: 'left',
        isBass: true,
        pitch: 'C',
        pitchClass: 0,
        teachingRole: 'anchor',
        voicingRole: 'required',
      },
      {
        degree: '3',
        finger: 1,
        hand: 'right',
        isBass: false,
        pitch: 'E',
        pitchClass: 4,
        teachingRole: 'quality',
        voicingRole: 'required',
      },
      {
        degree: '5',
        finger: 1,
        hand: 'left',
        isBass: false,
        pitch: 'G',
        pitchClass: 7,
        teachingRole: 'voicing',
        voicingRole: 'optional',
      },
      {
        degree: 'b7',
        finger: 2,
        hand: 'right',
        isBass: false,
        pitch: 'Bb',
        pitchClass: 10,
        teachingRole: 'guide',
        voicingRole: 'required',
      },
      {
        degree: '9',
        finger: 4,
        hand: 'right',
        isBass: false,
        pitch: 'D',
        pitchClass: 2,
        teachingRole: 'color',
        voicingRole: 'required',
      },
      {
        degree: '13',
        finger: 5,
        hand: 'right',
        isBass: false,
        pitch: 'A',
        pitchClass: 9,
        teachingRole: 'color',
        voicingRole: 'required',
      },
    ],
  },
} satisfies Record<string, TrainingSessionChord>;

const chordDisplays = {
  'C major': buildChordDisplay(chordProfiles.cMajor),
  'D minor 7': buildChordDisplay(chordProfiles.dMinor7),
  'G dominant 7': buildChordDisplay(chordProfiles.gDominant7),
  Fsus4: buildChordDisplay(chordProfiles.fSus4),
  C13: buildChordDisplay(chordProfiles.cDominantThirteenth),
} as const;

type ChordPreset = keyof typeof chordDisplays;
type ChordLearningCardStoryArgs = {
  chord: ChordPreset;
  stage: ChordToneStage;
};

const meta = {
  title: 'Components/ChordLearning/ChordLearningCard',
  args: { chord: 'C major', stage: 'anchor' },
  argTypes: {
    chord: {
      control: 'select',
      options: ['C major', 'D minor 7', 'G dominant 7', 'Fsus4', 'C13'] satisfies ChordPreset[],
    },
    stage: {
      control: 'select',
      options: [...chordLearningStages] satisfies ChordToneStage[],
    },
  },
  render: ({ chord, stage }: ChordLearningCardStoryArgs) => (
    <ChordLearningCard display={chordDisplays[chord]} onPlayPress={noop} toneStage={stage} />
  ),
} satisfies Meta<ChordLearningCardStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypicalMajor: Story = {};
export const SwipeableFullProgression: Story = { args: { chord: 'C13', stage: 'anchor' } };
export const SkippedStages: Story = { args: { chord: 'C major', stage: 'complete' } };
export const TypicalMinorSeventh: Story = { args: { chord: 'D minor 7', stage: 'guide' } };
export const TypicalDominantSeventh: Story = { args: { chord: 'G dominant 7', stage: 'guide' } };
export const Suspended: Story = { args: { chord: 'Fsus4', stage: 'quality' } };
export const ExtendedDominant: Story = {
  args: { chord: 'C13', stage: 'complete' },
};

function noop() {}
