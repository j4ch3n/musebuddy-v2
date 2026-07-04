import type { Meta, StoryObj } from '@storybook/react-native';

import { DailyProgress } from './daily-progress';

const meta = {
  title: 'UI/DailyProgress',
  component: DailyProgress,
  args: {
    currentStep: 'goal',
  },
  argTypes: {
    currentStep: {
      control: 'select',
      options: ['goal', 'chord', 'rhythm', 'pattern', 'jam'],
    },
  },
} satisfies Meta<typeof DailyProgress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Goal: Story = {};

export const Chord: Story = {
  args: {
    currentStep: 'chord',
  },
};

export const Rhythm: Story = {
  args: {
    currentStep: 'rhythm',
  },
};

export const Pattern: Story = {
  args: {
    currentStep: 'pattern',
  },
};

export const Jam: Story = {
  args: {
    currentStep: 'jam',
  },
};
