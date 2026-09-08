import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';

import { buildChordDisplay, midiToPitchClass, pitchClassToMidi } from '@/music-theory';

import {
  TrainingChordStageOverview,
  type TrainingChordStageOverviewConfig,
} from './training-chord-stage-overview';
import { TrainingRhythmStageOverview } from './training-rhythm-stage-overview';
import { TrainingVoicingStageOverview } from './training-voicing-stage-overview';

type StoryChordToken = Parameters<typeof buildChordDisplay>[0]['displayTokens'][number];

const chordFromTokens = (
  root: string,
  suffixTokens: readonly StoryChordToken[],
  degree: string,
) => {
  const displayTokens = [
    { teachingRole: 'anchor', type: 'root', value: root },
    ...suffixTokens,
  ] as const satisfies readonly StoryChordToken[];
  const symbol = displayTokens.map((token) => token.value).join('');

  return {
    chord: buildChordDisplay({
      displayTokens,
      idName: `${symbol}-${degree}`,
      normalizedSymbol: symbol,
      root,
      tones: [
        {
          degree: '1',
          pitch: root,
          pitchClass: midiToPitchClass(pitchClassToMidi(root, 4)),
        },
      ],
    }),
    degree,
  };
};

const chord = (root: string, suffix: string, degree: string) =>
  chordFromTokens(
    root,
    suffix
      ? [
          {
            teachingRole: suffix.startsWith('add') ? 'color' : 'quality',
            type: suffix.startsWith('add') ? 'addition' : 'quality',
            value: suffix,
          },
        ]
      : [],
    degree,
  );

const longChord = (root: string, suffixTokens: readonly StoryChordToken[], degree: string) =>
  chordFromTokens(root, suffixTokens, degree);

const progressionConfigs = {
  '1-2-2-1': {
    bars: [
      { chords: [chord('C', '', 'I')], id: 'bar-1' },
      {
        chords: [chord('A', 'm', 'vi'), chord('F', '', 'IV')],
        id: 'bar-2',
      },
      {
        chords: [chord('D', 'm', 'ii'), chord('G', '7', 'V⁷')],
        id: 'bar-3',
      },
      { chords: [chord('C', 'add9', 'I')], id: 'bar-4' },
    ],
    keySignatureLabel: 'C MAJOR',
  },
  '2-1-2-1': {
    bars: [
      {
        chords: [chord('C', '', 'I'), chord('A', 'm', 'vi')],
        id: 'bar-1',
      },
      { chords: [chord('F', '', 'IV')], id: 'bar-2' },
      {
        chords: [chord('D', 'm', 'ii'), chord('G', '7', 'V⁷')],
        id: 'bar-3',
      },
      { chords: [chord('C', 'add9', 'I')], id: 'bar-4' },
    ],
    keySignatureLabel: 'C MAJOR',
  },
  '2-2-2-2': {
    bars: [
      {
        chords: [
          longChord(
            'C',
            [
              { type: 'quality', value: 'maj' },
              { type: 'extension', value: '7' },
              { type: 'separator', value: '(' },
              { type: 'alteration', value: '#11' },
              { type: 'separator', value: ')' },
            ],
            'I',
          ),
          longChord(
            'A',
            [
              { type: 'quality', value: 'm' },
              { type: 'extension', value: '9' },
              { type: 'separator', value: '(' },
              { type: 'addition', value: 'add11' },
              { type: 'separator', value: ')' },
            ],
            'vi',
          ),
        ],
        id: 'bar-1',
      },
      {
        chords: [
          longChord(
            'F',
            [
              { type: 'quality', value: 'maj' },
              { type: 'extension', value: '9' },
              { type: 'separator', value: '/' },
              { type: 'bass', value: 'A' },
            ],
            'IV',
          ),
          longChord(
            'G',
            [
              { type: 'extension', value: '13' },
              { type: 'quality', value: 'sus4' },
            ],
            'V',
          ),
        ],
        id: 'bar-2',
      },
      {
        chords: [
          longChord(
            'D',
            [
              { type: 'quality', value: 'm' },
              { type: 'extension', value: '11' },
              { type: 'separator', value: '/' },
              { type: 'bass', value: 'C' },
            ],
            'ii',
          ),
          longChord(
            'B',
            [
              { type: 'quality', value: 'm' },
              { type: 'extension', value: '7' },
              { type: 'separator', value: '(' },
              { type: 'alteration', value: 'b5' },
              { type: 'separator', value: ')' },
            ],
            'viiø',
          ),
        ],
        id: 'bar-3',
      },
      {
        chords: [
          longChord(
            'E',
            [
              { type: 'extension', value: '7' },
              { type: 'separator', value: '(' },
              { type: 'alteration', value: '#9' },
              { type: 'separator', value: ',' },
              { type: 'alteration', value: 'b13' },
              { type: 'separator', value: ')' },
            ],
            'III',
          ),
          longChord(
            'A',
            [
              { type: 'addition', value: 'add9' },
              { type: 'separator', value: '/' },
              { type: 'bass', value: 'C#' },
            ],
            'vi',
          ),
        ],
        id: 'bar-4',
      },
    ],
    keySignatureLabel: 'C MAJOR',
  },
} satisfies Record<string, TrainingChordStageOverviewConfig>;

const progressionOptions = Object.keys(progressionConfigs) as (keyof typeof progressionConfigs)[];

const meta = {
  title: 'Components/TrainingStageOverview',
  component: TrainingChordStageOverview,
  decorators: [
    (Story) => (
      <View style={styles.fullBleed}>
        <Story />
      </View>
    ),
  ],
  args: { config: progressionConfigs['1-2-2-1'] },
} satisfies Meta<typeof TrainingChordStageOverview>;
export default meta;
type Story = StoryObj<typeof meta>;
type RhythmStory = StoryObj<{ staff: 'bass' | 'treble' }>;

const chordOverviewArgTypes: Story['argTypes'] = {
  config: {
    control: 'select',
    mapping: progressionConfigs,
    options: progressionOptions,
  },
};

export const FullChord: Story = {
  args: { colorized: true, displayMode: 'full-chord' },
  argTypes: {
    ...chordOverviewArgTypes,
    displayMode: { table: { disable: true } },
  },
  render: (args) => <TrainingChordStageOverview {...args} />,
};

export const RootPath: Story = {
  args: { colorized: false, displayMode: 'root-only' },
  argTypes: {
    ...chordOverviewArgTypes,
    displayMode: { table: { disable: true } },
  },
  render: (args) => <TrainingChordStageOverview {...args} />,
};

export const Rhythm: RhythmStory = {
  args: { staff: 'treble' },
  argTypes: {
    staff: {
      control: 'select',
      options: ['treble', 'bass'],
    },
  },
  render: ({ staff }) => <TrainingRhythmStageOverview staff={staff} />,
};

export const Voicing: Story = {
  render: () => <TrainingVoicingStageOverview />,
};

const styles = StyleSheet.create({
  fullBleed: {
    flex: 1,
    margin: -24,
  },
});
