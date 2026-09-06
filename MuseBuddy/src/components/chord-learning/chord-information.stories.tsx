import type { Meta, StoryObj } from '@storybook/react-native';

import type { ChordDisplay } from '@/music-theory';
import { FlashCard } from '@/ui';
import { museBuddyColors } from '@/constants/design-tokens';

import { ChordInformation } from './chord-information';

const display: ChordDisplay = {
  commonNotations: ['C13(#11)/G'],
  friendlyName: 'C dominant thirteen sharp eleven over G',
  idName: 'c-thirteen-sharp-eleven-over-g',
  normalizedSymbol: 'C13(#11)/G',
  symbol: 'C13(#11)/G',
  tokens: [
    { teachingRole: 'anchor', text: 'C', type: 'root' },
    { teachingRole: 'color', text: '13', type: 'extension' },
    { teachingRole: null, text: '(', type: 'separator' },
    { teachingRole: 'color', text: '#11', type: 'alteration' },
    { teachingRole: null, text: ')', type: 'separator' },
    { teachingRole: null, text: '/', type: 'separator' },
    { teachingRole: 'anchor', text: 'G', type: 'bass' },
  ],
  notes: [
    {
      accidental: '',
      degree: '5',
      isBass: true,
      isRoot: false,
      letter: 'G',
      midi: 55,
      octave: 3,
      pitchClass: 7,
      teachingRole: 'voicing',
      text: 'G3',
      vexflowKey: 'g/3',
      voicingRole: 'optional',
    },
    {
      accidental: '',
      degree: '1',
      isBass: false,
      isRoot: true,
      letter: 'C',
      midi: 60,
      octave: 4,
      pitchClass: 0,
      teachingRole: 'anchor',
      text: 'C4',
      vexflowKey: 'c/4',
      voicingRole: 'required',
    },
    {
      accidental: '',
      degree: '3',
      isBass: false,
      isRoot: false,
      letter: 'E',
      midi: 64,
      octave: 4,
      pitchClass: 4,
      teachingRole: 'quality',
      text: 'E4',
      vexflowKey: 'e/4',
      voicingRole: 'required',
    },
    {
      accidental: '#',
      degree: 'b7',
      isBass: false,
      isRoot: false,
      letter: 'B',
      midi: 70,
      octave: 4,
      pitchClass: 10,
      teachingRole: 'guide',
      text: 'Bb4',
      vexflowKey: 'bb/4',
      voicingRole: 'required',
    },
    {
      accidental: '',
      degree: '9',
      isBass: false,
      isRoot: false,
      letter: 'D',
      midi: 74,
      octave: 5,
      pitchClass: 2,
      teachingRole: 'color',
      text: 'D5',
      vexflowKey: 'd/5',
      voicingRole: 'required',
    },
    {
      accidental: '#',
      degree: '#11',
      isBass: false,
      isRoot: false,
      letter: 'F',
      midi: 78,
      octave: 5,
      pitchClass: 6,
      teachingRole: 'color',
      text: 'F#5',
      vexflowKey: 'f#/5',
      voicingRole: 'required',
    },
    {
      accidental: '',
      degree: '13',
      isBass: false,
      isRoot: false,
      letter: 'A',
      midi: 81,
      octave: 5,
      pitchClass: 9,
      teachingRole: 'color',
      text: 'A5',
      vexflowKey: 'a/5',
      voicingRole: 'required',
    },
  ],
};
const meta = {
  title: 'Components/ChordLearning/ChordInformation',
  component: ChordInformation,
  args: { display, onPlayPress: () => {}, toneStage: 'anchor' },
  render: (args) => (
    <FlashCard
      heightMode="daily-training"
      shadowColor={museBuddyColors.sky}
      sideA={<ChordInformation {...args} />}
      surface="supporting"
    />
  ),
} satisfies Meta<typeof ChordInformation>;
export default meta;
type Story = StoryObj<typeof meta>;
const anchorOnlyDisplay: ChordDisplay = {
  ...display,
  notes: display.notes.filter((note) => note.isRoot),
};

export const Anchor: Story = { args: { display: anchorOnlyDisplay } };
export const Quality: Story = { args: { toneStage: 'quality' } };
export const Guide: Story = { args: { toneStage: 'guide' } };
export const Color: Story = { args: { toneStage: 'color' } };
export const Complete: Story = { args: { toneStage: 'complete' } };
