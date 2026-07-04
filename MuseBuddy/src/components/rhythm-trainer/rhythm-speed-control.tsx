import { PillButtonController, type PillButtonOption } from '@/ui';

import { RHYTHM_SPEED_OPTIONS } from './constants';

type RhythmSpeedControlProps = {
  onChange: (bpm: number) => void;
  value: number;
};

export function RhythmSpeedControl({ onChange, value }: RhythmSpeedControlProps) {
  const options: PillButtonOption<number>[] = RHYTHM_SPEED_OPTIONS.map((option) => ({
    accessibilityLabel: `${option.label}, ${option.bpm} BPM`,
    description: `${option.bpm} BPM`,
    id: option.id,
    label: option.label,
    value: option.bpm,
  }));

  return (
    <PillButtonController
      accessibilityLabel="Rhythm playback speed"
      label="Speed"
      onChange={onChange}
      options={options}
      value={value}
    />
  );
}
