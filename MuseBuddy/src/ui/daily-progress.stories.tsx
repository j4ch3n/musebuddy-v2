import type { Meta, StoryObj } from '@storybook/react-native';

import { DailyProgress } from './daily-progress';

const meta = {
  title: 'UI/DailyProgress',
  component: DailyProgress,
  args: {
    currentStep: 'chord',
  },
  argTypes: {
    currentStep: {
      control: 'select',
      options: ['chord', 'rhythm', 'jam'],
    },
  },
} satisfies Meta<typeof DailyProgress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Chord: Story = {};

export const Rhythm: Story = {
  args: {
    currentStep: 'rhythm',
  },
};

export const Jam: Story = {
  args: {
    currentStep: 'jam',
  },
};
