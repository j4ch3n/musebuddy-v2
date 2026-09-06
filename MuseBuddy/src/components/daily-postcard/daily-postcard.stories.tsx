import type { Meta, StoryObj } from '@storybook/react-native';
import { prepareTrainingSessionDisplay } from '@/music-theory';
import { createTrainingSession } from '@/contexts/training-session-test-fixture';
import { DailyPostcardCard } from './daily-postcard';

const session = prepareTrainingSessionDisplay(createTrainingSession(4));
const meta = {
  title: 'Components/DailyPostcard',
  component: DailyPostcardCard,
  args: { compact: false, previewStepIndex: 0, session },
} satisfies Meta<typeof DailyPostcardCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Full: Story = {};
export const Compact: Story = { args: { compact: true } };
