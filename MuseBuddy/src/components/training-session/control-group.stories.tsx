import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, Text } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { TactileControlAction } from '@/ui';

import { ControlGroup } from './control-group';

const noop = () => {};

const meta = {
  title: 'Components/TrainingSession/ControlGroup',
  component: ControlGroup,
  args: {
    action: <StageAction label="Start performance" />,
    bpm: 96,
    onBpmChange: noop,
    onExit: noop,
    onExitConfirmed: noop,
  },
} satisfies Meta<typeof ControlGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ReadyToStart: Story = {};

export const Preparing: Story = {
  args: {
    action: <StageAction disabled label="Preparing…" />,
  },
};

export const PerformanceInProgress: Story = {
  args: {
    action: <StageAction label="Stop performance" surface="active" />,
  },
};

function StageAction({
  disabled = false,
  label,
  surface = 'primary',
}: {
  disabled?: boolean;
  label: string;
  surface?: 'active' | 'primary';
}) {
  return (
    <TactileControlAction
      accessibilityLabel={label}
      disabled={disabled}
      onPress={noop}
      style={[styles.action, surface === 'active' ? styles.activeAction : styles.primaryAction]}
    >
      <Text style={[styles.label, surface === 'active' ? styles.activeLabel : null]}>{label}</Text>
    </TactileControlAction>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `4px 4px 0 ${museBuddyColors.pine}`,
    height: 44,
    justifyContent: 'center',
    minWidth: 158,
    paddingHorizontal: 18,
  },
  activeAction: { backgroundColor: museBuddyColors.sky },
  activeLabel: { color: museBuddyColors.pine },
  label: { color: museBuddyColors.mist, fontSize: 15, fontWeight: '800' },
  primaryAction: { backgroundColor: museBuddyColors.wildflower },
});
