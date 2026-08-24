import { Lucide } from '@react-native-vector-icons/lucide';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';

import { museBuddyColors } from '@/constants/design-tokens';

export type TrainingStageIconId = 'goal' | 'bars';

export function TrainingStageIcon({
  color = museBuddyColors.pine,
  id,
  size,
}: {
  color?: string;
  id: TrainingStageIconId;
  size: number;
}) {
  return id === 'goal' ? (
    <Lucide color={color} name="book-open" size={size} />
  ) : (
    <MaterialIcons color={color} name="grid-on" size={size} />
  );
}
