import type { Meta, StoryObj } from '@storybook/react-native';

import type { TrainingSessionChord } from '@/contexts/training-session-schema';
import { buildChordDisplay } from '@/music-theory';

import { ChordLearningCard } from './chord-learning-card';

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
  cSharpDominantThirteenthFlatNinthSharpEleventhOverGSharp: {
    displayTokens: [
      { teachingRole: 'anchor', type: 'root', value: 'C#' },
      { teachingRole: 'color', type: 'extension', value: '13' },
      { teachingRole: 'color', type: 'alteration', value: 'b9' },
      { teachingRole: 'color', type: 'alteration', value: '#11' },
      { teachingRole: null, type: 'separator', value: '/' },
      { teachingRole: null, type: 'bass', value: 'G#' },
    ],
    idName: 'c-sharp-dominant-thirteenth-flat-ninth-sharp-eleventh-over-g-sharp',
    normalizedSymbol: 'C#13b9#11/G#',
    root: 'C#',
    tones: [
      {
        degree: '5',
        finger: 5,
        hand: 'left',
        isBass: true,
        pitch: 'G#',
        pitchClass: 8,
        teachingRole: 'anchor',
        voicingRole: 'required',
      },
      {
        degree: '1',
        finger: 2,
        hand: 'left',
        isBass: false,
        pitch: 'C#',
        pitchClass: 1,
        teachingRole: 'anchor',
        voicingRole: 'required',
      },
      {
        degree: '3',
        finger: 1,
        hand: 'right',
        isBass: false,
        pitch: 'E#',
        pitchClass: 5,
        teachingRole: 'quality',
        voicingRole: 'required',
      },
      {
        degree: 'b7',
        finger: 2,
        hand: 'right',
        isBass: false,
        pitch: 'B',
        pitchClass: 11,
        teachingRole: 'guide',
        voicingRole: 'required',
      },
      {
        degree: 'b9',
        finger: 3,
        hand: 'right',
        isBass: false,
        pitch: 'D',
        pitchClass: 2,
        teachingRole: 'color',
        voicingRole: 'required',
      },
      {
        degree: '#11',
        finger: 4,
        hand: 'right',
        isBass: false,
        pitch: 'G',
        pitchClass: 7,
        teachingRole: 'color',
        voicingRole: 'required',
      },
      {
        degree: '13',
        finger: 5,
        hand: 'right',
        isBass: false,
        pitch: 'A#',
        pitchClass: 10,
        teachingRole: 'color',
        voicingRole: 'required',
      },
    ],
  },
} satisfies Record<string, TrainingSessionChord>;

const chordDisplays = {
  'C major': buildChordDisplay(chordProfiles.cMajor),
  'C dominant thirteenth': buildChordDisplay(chordProfiles.cDominantThirteenth),
  'C sharp dominant thirteenth flat ninth sharp eleventh over G sharp': buildChordDisplay(
    chordProfiles.cSharpDominantThirteenthFlatNinthSharpEleventhOverGSharp,
  ),
  'D minor seventh': buildChordDisplay(chordProfiles.dMinor7),
  'F suspended fourth': buildChordDisplay(chordProfiles.fSus4),
  'G dominant seventh': buildChordDisplay(chordProfiles.gDominant7),
} as const;

type ChordPreset = keyof typeof chordDisplays;
type ChordLearningCardStoryArgs = {
  chord: ChordPreset;
};

const meta = {
  title: 'Components/ChordLearning/ChordLearningCard',
  args: { chord: 'C major' },
  argTypes: {
    chord: {
      control: 'select',
      options: Object.keys(chordDisplays) as ChordPreset[],
    },
  },
  render: ({ chord }: ChordLearningCardStoryArgs) => (
    <ChordLearningCard display={chordDisplays[chord]} onPlayPress={noop} toneStage="complete" />
  ),
} satisfies Meta<ChordLearningCardStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chord: Story = {};

export const LongChordName: Story = {
  args: {
    chord: 'C sharp dominant thirteenth flat ninth sharp eleventh over G sharp',
  },
};

function noop() {}
