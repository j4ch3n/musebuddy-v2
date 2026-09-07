import type { Meta, StoryObj } from '@storybook/react-native';

import { PlayButton } from './play-button';

const meta = {
  title: 'UI/PlayButton',
  component: PlayButton,
  args: { onPress: () => {} },
} satisfies Meta<typeof PlayButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const Playing: Story = { args: { isPlaying: true } };
export const Disabled: Story = { args: { disabled: true } };
