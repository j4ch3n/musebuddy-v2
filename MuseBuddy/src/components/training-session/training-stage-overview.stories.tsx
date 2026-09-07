import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';

import { buildChordDisplay, midiToPitchClass, pitchClassToMidi } from '@/music-theory';

import {
  TrainingChordStageOverview,
  type TrainingChordStageOverviewConfig,
} from './training-chord-stage-overview';
import { TrainingRhythmStageOverview } from './training-rhythm-stage-overview';
import { TrainingVoicingStageOverview } from './training-voicing-stage-overview';

const chord = (root: string, suffix: string, degree: string) => ({
  chord: buildChordDisplay({
    displayTokens: [
      { teachingRole: 'anchor', type: 'root', value: root },
      ...(suffix
        ? [
            {
              teachingRole: suffix.startsWith('add') ? 'color' : 'quality',
              type: suffix.startsWith('add') ? 'addition' : 'quality',
              value: suffix,
            } as const,
          ]
        : []),
    ],
    idName: `${root}-${suffix || 'major'}-${degree}`,
    normalizedSymbol: `${root}${suffix}`,
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
});

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
    keyLabel: 'C MAJOR · 4/4',
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
    keyLabel: 'C MAJOR · 4/4',
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

export const Chord: Story = {
  argTypes: {
    config: {
      control: 'select',
      mapping: progressionConfigs,
      options: progressionOptions,
    },
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
