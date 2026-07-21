import { useEffect, useMemo, useRef, useState } from 'react';

import { addAttackListener } from '@modules/piano-attack-detector';

import {
  createRhythmListenProgress,
  deriveRhythmListenProgress,
  type RhythmDetectedAttack,
  type RhythmListenProgress,
} from './rhythm-listen-progress';
import type { RhythmPattern } from './types';

const CLOCK_INTERVAL_MS = 30;

type UseRhythmListenProgressOptions = {
  allowedOffsetMs: number;
  flowId: number;
  listeningDurationMs: number;
  listeningStartedAtMs: number | null;
  onComplete: () => Promise<void>;
  pattern: RhythmPattern;
  phase: 'pending' | 'prepare' | 'demo' | 'listening' | 'finish';
  stepDurationMs: number;
};

type RhythmRoundState = {
  attacks: readonly RhythmDetectedAttack[];
  combo: number;
  elapsedMs: number;
  flowId: number;
  listeningStartedAtMs: number | null;
  startingCombo: number;
};

type ProgressConfiguration = Pick<
  UseRhythmListenProgressOptions,
  'allowedOffsetMs' | 'listeningDurationMs' | 'pattern' | 'stepDurationMs'
>;

type LatestConfiguration = ProgressConfiguration &
  Pick<UseRhythmListenProgressOptions, 'flowId' | 'listeningStartedAtMs' | 'phase'>;

export function useRhythmListenProgress({
  allowedOffsetMs,
  flowId,
  listeningDurationMs,
  listeningStartedAtMs,
  onComplete,
  pattern,
  phase,
  stepDurationMs,
}: UseRhythmListenProgressOptions) {
  const [round, setRound] = useState<RhythmRoundState>(() => createRoundState(flowId));
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const completionStartedRef = useRef(false);
  const latestConfigurationRef = useRef<LatestConfiguration>({
    allowedOffsetMs,
    flowId,
    listeningDurationMs,
    listeningStartedAtMs,
    pattern,
    phase,
    stepDurationMs,
  });

  if (round.flowId !== flowId) {
    setRound(createRoundState(flowId, listeningStartedAtMs));
    setCurrentStepIndex(null);
  } else if (listeningStartedAtMs !== null && round.listeningStartedAtMs !== listeningStartedAtMs) {
    setRound(createRoundState(flowId, listeningStartedAtMs, round.combo));
    setCurrentStepIndex(null);
  }

  useEffect(() => {
    latestConfigurationRef.current = {
      allowedOffsetMs,
      flowId,
      listeningDurationMs,
      listeningStartedAtMs,
      pattern,
      phase,
      stepDurationMs,
    };
  }, [
    allowedOffsetMs,
    flowId,
    listeningDurationMs,
    listeningStartedAtMs,
    pattern,
    phase,
    stepDurationMs,
  ]);

  useEffect(() => {
    if (phase !== 'listening' || listeningStartedAtMs === null) {
      return;
    }

    completionStartedRef.current = false;
    const configuration: ProgressConfiguration = {
      allowedOffsetMs,
      listeningDurationMs,
      pattern,
      stepDurationMs,
    };
    const update = () => {
      const elapsedMs = Math.max(0, Date.now() - listeningStartedAtMs);
      if (elapsedMs >= listeningDurationMs) {
        if (completionStartedRef.current) {
          return;
        }
        completionStartedRef.current = true;
        setRound((current) => {
          const activeRound = activateRoundState(current, flowId, listeningStartedAtMs);
          const progress = deriveRoundProgress(activeRound, configuration, listeningDurationMs);
          return {
            ...activeRound,
            combo: progress.combo,
            elapsedMs: listeningDurationMs,
          };
        });
        setCurrentStepIndex(null);
        void onComplete();
        return;
      }

      setCurrentStepIndex(Math.floor(elapsedMs / stepDurationMs));
      setRound((current) => {
        const activeRound = activateRoundState(current, flowId, listeningStartedAtMs);
        const progress = deriveRoundProgress(activeRound, configuration, elapsedMs);
        return { ...activeRound, combo: progress.combo, elapsedMs };
      });
    };

    update();
    const timer = setInterval(update, CLOCK_INTERVAL_MS);
    return () => {
      clearInterval(timer);
    };
  }, [
    allowedOffsetMs,
    flowId,
    listeningDurationMs,
    listeningStartedAtMs,
    onComplete,
    pattern,
    phase,
    stepDurationMs,
  ]);

  useEffect(() => {
    const subscription = addAttackListener((attack) => {
      const latest = latestConfigurationRef.current;
      const startedAtMs = latest.listeningStartedAtMs;
      if (startedAtMs === null) {
        return;
      }
      const attackOffsetMs = attack.absoluteTimeMs - startedAtMs;
      if (
        attackOffsetMs < -latest.allowedOffsetMs ||
        attackOffsetMs >= latest.listeningDurationMs
      ) {
        return;
      }

      setRound((current) => {
        const activeRound = activateRoundState(current, latest.flowId, startedAtMs);
        if (activeRound.attacks.some(({ id }) => id === attack.id)) {
          return activeRound;
        }
        const nextRound = {
          ...activeRound,
          attacks: [
            ...activeRound.attacks,
            { absoluteTimeMs: attack.absoluteTimeMs, id: attack.id },
          ],
        };
        if (latest.phase !== 'listening') {
          return nextRound;
        }
        const progress = deriveRoundProgress(nextRound, latest);
        return { ...nextRound, combo: progress.combo };
      });
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const progress = useMemo(
    () =>
      deriveRoundProgress(round, {
        allowedOffsetMs,
        listeningDurationMs,
        pattern,
        stepDurationMs,
      }),
    [allowedOffsetMs, listeningDurationMs, pattern, round, stepDurationMs],
  );

  return {
    attackDots: phase === 'listening' ? progress.dots : [],
    combo: round.combo,
    currentStepIndex: phase === 'listening' ? currentStepIndex : null,
  };
}

function activateRoundState(
  current: RhythmRoundState,
  flowId: number,
  listeningStartedAtMs: number,
): RhythmRoundState {
  if (current.flowId !== flowId) {
    return createRoundState(flowId, listeningStartedAtMs);
  }
  if (current.listeningStartedAtMs === listeningStartedAtMs) {
    return current;
  }
  return createRoundState(flowId, listeningStartedAtMs, current.combo);
}

function createRoundState(
  flowId: number,
  listeningStartedAtMs: number | null = null,
  combo = 0,
): RhythmRoundState {
  return {
    attacks: [],
    combo,
    elapsedMs: 0,
    flowId,
    listeningStartedAtMs,
    startingCombo: combo,
  };
}

function deriveRoundProgress(
  round: RhythmRoundState,
  configuration: ProgressConfiguration,
  elapsedMs = round.elapsedMs,
): RhythmListenProgress {
  if (round.listeningStartedAtMs === null) {
    return createRhythmListenProgress(
      configuration.pattern,
      configuration.stepDurationMs,
      round.combo,
    );
  }
  return deriveRhythmListenProgress({
    ...configuration,
    attacks: round.attacks,
    elapsedMs,
    listeningStartedAtMs: round.listeningStartedAtMs,
    startingCombo: round.startingCombo,
  });
}
