import type { Meta, StoryObj } from '@storybook/react-native';

import { pianoPitchClasses, type PianoPitchClass } from '@schema/music-theory-schema';

import { PianoKeyboard, type PianoKeyboardMarkerTone } from './piano-keyboard';

type ChordPreset =
  | 'C major'
  | 'A minor'
  | 'G7'
  | 'Cmaj7'
  | 'Csus4'
  | 'Cadd9'
  | 'C(no3)'
  | 'F# diminished'
  | 'Manual';

type PianoKeyboardStoryArgs = {
  chordPreset: ChordPreset;
  root: PianoPitchClass;
  keys: PianoPitchClass[];
  markerTones: Partial<Record<PianoPitchClass, PianoKeyboardMarkerTone>>;
};

const chordPresets = {
  'C major': { root: 0, keys: [4, 7] },
  'A minor': { root: 9, keys: [0, 4] },
  G7: { root: 7, keys: [11, 2, 5] },
  Cmaj7: { root: 0, keys: [4, 7, 11] },
  Csus4: { root: 0, keys: [5, 7] },
  Cadd9: { root: 0, keys: [2, 4, 7] },
  'C(no3)': { root: 0, keys: [7] },
  'F# diminished': { root: 6, keys: [9, 0] },
} satisfies Record<
  Exclude<ChordPreset, 'Manual'>,
  { root: PianoPitchClass; keys: PianoPitchClass[] }
>;

const chordPresetOptions: ChordPreset[] = [
  'C major',
  'A minor',
  'G7',
  'Cmaj7',
  'Csus4',
  'Cadd9',
  'C(no3)',
  'F# diminished',
  'Manual',
];

const meta = {
  title: 'UI/PianoKeyboard',
  component: PianoKeyboard,
  args: {
    chordPreset: 'C major',
    root: 0,
    keys: [4, 7],
    markerTones: {
      4: 'essential',
      7: 'supporting',
    },
  },
  argTypes: {
    chordPreset: {
      control: 'select',
      options: chordPresetOptions,
    },
    root: {
      control: 'select',
      options: pianoPitchClasses,
    },
    keys: {
      control: 'object',
    },
  },
  render: ({ chordPreset, keys, markerTones, root }: PianoKeyboardStoryArgs) => {
    if (chordPreset === 'Manual') {
      return <PianoKeyboard keys={keys} markerTones={markerTones} root={root} width={320} />;
    }

    const preset = chordPresets[chordPreset];

    return (
      <PianoKeyboard keys={preset.keys} markerTones={markerTones} root={preset.root} width={320} />
    );
  },
} satisfies Meta<PianoKeyboardStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Chord: Story = {};
