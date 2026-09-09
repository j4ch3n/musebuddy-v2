import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';

import {
  TrainingStagePatternOverview,
  type TrainingPatternHand,
} from './training-stage-pattern-overview';

const rhythmProgressions = {
  '1 chord': ['I'],
  '2 chords': ['I', 'V'],
  '3 chords': ['I', 'IV', 'V'],
  '4 chords': ['I', 'V', 'vi', 'IV'],
  '5 chords': ['I', 'vi', 'IV', 'V', 'I'],
  '6 chords': ['I', 'V', 'vi', 'iii', 'IV', 'ii'],
  '7 chords': ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  '8 chords': ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', 'I'],
} as const;

type RhythmClef = 'bass' | 'together' | 'treble';
type RhythmProgression = keyof typeof rhythmProgressions;

type RhythmOverviewStoryProps = {
  clef: RhythmClef;
  progression: RhythmProgression;
};

function handForClef(clef: RhythmClef): TrainingPatternHand {
  if (clef === 'treble') return 'right';
  if (clef === 'bass') return 'left';
  return 'together';
}

function RhythmOverviewStory({ clef, progression }: RhythmOverviewStoryProps) {
  return (
    <TrainingStagePatternOverview
      config={{
        degrees: rhythmProgressions[progression],
        detail: 'rhythm',
        hand: handForClef(clef),
        keySignatureLabel: 'C MAJOR',
      }}
    />
  );
}

const meta = {
  title: 'Components/TrainingStageOverview',
  component: RhythmOverviewStory,
  decorators: [
    (Story) => (
      <View style={styles.fullBleed}>
        <Story />
      </View>
    ),
  ],
  args: {
    clef: 'treble',
    progression: '4 chords',
  },
  argTypes: {
    clef: {
      control: 'select',
      options: ['treble', 'bass', 'together'],
    },
    progression: {
      control: 'select',
      options: Object.keys(rhythmProgressions),
    },
  },
} satisfies Meta<typeof RhythmOverviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rhythm: Story = {};

const styles = StyleSheet.create({
  fullBleed: {
    flex: 1,
    margin: -24,
  },
});
