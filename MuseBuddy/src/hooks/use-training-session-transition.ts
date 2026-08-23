import { useCallback } from 'react';
import { useRouter } from 'expo-router';

import {
  getNextTrainingSessionTransition,
  getSkipTrainingSectionTransition,
  type TrainingScreenId,
  type TrainingSectionId,
} from '@/contexts/training-session-flow';
import { useTrainingSession } from '@/contexts/training-session-context';

type UseTrainingSessionTransitionOptions = {
  onScreenChange: (screenId: TrainingScreenId) => void;
  screenId: TrainingScreenId;
  sectionId: TrainingSectionId;
};

export function useTrainingSessionTransition({
  onScreenChange,
  screenId,
  sectionId,
}: UseTrainingSessionTransitionOptions) {
  const router = useRouter();
  const { session } = useTrainingSession();

  const applyTransition = useCallback(
    (transition: ReturnType<typeof getNextTrainingSessionTransition>) => {
      if (transition.kind === 'screen') {
        onScreenChange(transition.screenId);
        return;
      }

      router.replace(transition.href);
    },
    [onScreenChange, router],
  );

  const advance = useCallback(() => {
    if (!session) {
      return;
    }

    applyTransition(getNextTrainingSessionTransition({ screenId, sectionId, session }));
  }, [applyTransition, screenId, sectionId, session]);

  const skipSection = useCallback(() => {
    applyTransition(getSkipTrainingSectionTransition({ sectionId }));
  }, [applyTransition, sectionId]);

  return { advance, skipSection };
}
