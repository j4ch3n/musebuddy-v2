import type { Meta, StoryObj } from '@storybook/react-native';

import { DailyProgressNavigator } from './daily-progress-navigator';

const meta = {
  title: 'UI/DailyProgressNavigator',
  component: DailyProgressNavigator,
  args: {
    currentStep: 'goal',
  },
  argTypes: {
    currentStep: {
      control: 'select',
      options: ['goal', 'chord', 'rhythm-bass', 'rhythm-treble', 'pattern'],
    },
  },
} satisfies Meta<typeof DailyProgressNavigator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Goal: Story = {};

export const Chord: Story = {
  args: {
    currentStep: 'chord',
  },
};

export const BassRhythm: Story = {
  args: {
    currentStep: 'rhythm-bass',
  },
};

export const TrebleRhythm: Story = {
  args: {
    currentStep: 'rhythm-treble',
  },
};

export const Pattern: Story = {
  args: {
    currentStep: 'pattern',
  },
};
