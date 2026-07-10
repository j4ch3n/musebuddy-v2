import { BpmControl } from '@/ui';

type RhythmSpeedControlProps = {
  onChange: (bpm: number) => void;
  value: number;
};

export function RhythmSpeedControl({ onChange, value }: RhythmSpeedControlProps) {
  return <BpmControl onChange={onChange} value={value} />;
}
