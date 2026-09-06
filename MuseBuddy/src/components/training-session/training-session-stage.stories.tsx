import type { Meta, StoryObj } from '@storybook/react-native';

import { createTrainingSession } from '@/contexts/training-session-test-fixture';
import { prepareTrainingSessionDisplay } from '@/music-theory';

import { TrainingSessionStage } from './training-session-stage';

const session = prepareTrainingSessionDisplay(createTrainingSession(4));
const meta = {
  title: 'Components/TrainingSession/TrainingSessionCard',
  component: TrainingSessionStage,
  args: {
    focus: 'chords',
    isPlaying: false,
    onPlayPress: () => {},
    onRhythmStaffChange: () => {},
    rhythmStaff: 'treble',
    session,
  },
} satisfies Meta<typeof TrainingSessionStage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Chords: Story = {};
export const RhythmTreble: Story = { args: { focus: 'rhythm' } };
export const RhythmBass: Story = { args: { focus: 'rhythm', rhythmStaff: 'bass' } };
export const Voicing: Story = { args: { focus: 'voicing' } };
