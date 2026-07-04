import { AudioContext } from 'react-native-audio-api';
import { useCallback, useEffect, useRef, useState } from 'react';

import { collectRhythmEvents } from './rhythm-pattern';
import type { RhythmAttack, RhythmPattern } from './types';

type UseSequencerPlaybackOptions = {
  bpm: number;
  pattern: RhythmPattern;
};

type ScheduledNode = {
  stop: (when?: number) => void;
};

const LOOKAHEAD_SECONDS = 0.45;
const SCHEDULER_INTERVAL_MS = 90;
const VISUAL_INTERVAL_MS = 30;
const ATTACK_DURATION_SECONDS = 0.055;

const ATTACK_SOUND: Record<RhythmAttack, { frequency: number; gain: number }> = {
  s: { frequency: 880, gain: 0.28 },
  w: { frequency: 1174.66, gain: 0.18 },
};

export function useSequencerPlayback({ bpm, pattern }: UseSequencerPlaybackOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const scheduledUntilRef = useRef(0);
  const scheduledNodesRef = useRef<ScheduledNode[]>([]);
  const patternRef = useRef(pattern);
  const bpmRef = useRef(bpm);
  const previousBpmRef = useRef(bpm);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    return audioContextRef.current;
  }, []);

  const stopScheduledNodes = useCallback(() => {
    const audioContext = audioContextRef.current;
    const stopTime = audioContext?.currentTime ?? 0;

    scheduledNodesRef.current.forEach((node) => {
      try {
        node.stop(stopTime);
      } catch {
        // Some nodes may have already ended by the time stop is requested.
      }
    });
    scheduledNodesRef.current = [];
  }, []);

  const scheduleAttack = useCallback(
    (audioContext: AudioContext, attack: RhythmAttack, startTime: number) => {
      const sound = ATTACK_SOUND[attack];
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const endTime = startTime + ATTACK_DURATION_SECONDS;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(sound.frequency, startTime);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(sound.gain, startTime + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startTime);
      oscillator.stop(endTime + 0.01);
      scheduledNodesRef.current.push(oscillator);
    },
    [],
  );

  const scheduleThrough = useCallback(
    (audioContext: AudioContext, targetTime: number) => {
      const startTime = startTimeRef.current;

      if (startTime === null) {
        return;
      }

      const stepDurationSeconds = 15 / bpmRef.current;
      const cycleDurationSeconds = patternRef.current.length * stepDurationSeconds;
      const events = collectRhythmEvents(patternRef.current).filter(
        (event) => event.kind === 'attack' && event.attack !== null,
      );
      let cycleStartTime =
        startTime +
        Math.floor((scheduledUntilRef.current - startTime) / cycleDurationSeconds) *
          cycleDurationSeconds;

      while (cycleStartTime < targetTime) {
        events.forEach((event) => {
          const eventStartTime = cycleStartTime + event.startStep * stepDurationSeconds;

          if (eventStartTime >= scheduledUntilRef.current && eventStartTime < targetTime) {
            scheduleAttack(audioContext, event.attack as RhythmAttack, eventStartTime);
          }
        });

        cycleStartTime += cycleDurationSeconds;
      }

      scheduledUntilRef.current = targetTime;
    },
    [scheduleAttack],
  );

  const stopPlayback = useCallback(() => {
    stopScheduledNodes();
    startTimeRef.current = null;
    scheduledUntilRef.current = 0;
    setIsPlaying(false);
    setCurrentStepIndex(null);
  }, [stopScheduledNodes]);

  const startPlayback = useCallback(async () => {
    const audioContext = getAudioContext();

    await audioContext.resume();
    stopScheduledNodes();

    const startTime = audioContext.currentTime + 0.08;
    startTimeRef.current = startTime;
    scheduledUntilRef.current = startTime;
    setCurrentStepIndex(0);
    setIsPlaying(true);
    scheduleThrough(audioContext, startTime + LOOKAHEAD_SECONDS);
  }, [getAudioContext, scheduleThrough, stopScheduledNodes]);

  const restartPlayback = useCallback(async () => {
    const audioContext = getAudioContext();

    await audioContext.resume();
    stopScheduledNodes();

    const startTime = audioContext.currentTime + 0.08;
    startTimeRef.current = startTime;
    scheduledUntilRef.current = startTime;
    setCurrentStepIndex(0);
    scheduleThrough(audioContext, startTime + LOOKAHEAD_SECONDS);
  }, [getAudioContext, scheduleThrough, stopScheduledNodes]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    void startPlayback();
  }, [isPlaying, startPlayback, stopPlayback]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const intervalId = setInterval(() => {
      const audioContext = audioContextRef.current;

      if (!audioContext) {
        return;
      }

      scheduleThrough(audioContext, audioContext.currentTime + LOOKAHEAD_SECONDS);
    }, SCHEDULER_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isPlaying, scheduleThrough]);

  useEffect(() => {
    const didChangeBpm = previousBpmRef.current !== bpm;

    bpmRef.current = bpm;
    previousBpmRef.current = bpm;

    if (!isPlaying || !didChangeBpm) {
      return;
    }

    void restartPlayback();
  }, [bpm, isPlaying, restartPlayback]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const intervalId = setInterval(() => {
      const audioContext = audioContextRef.current;
      const startTime = startTimeRef.current;

      if (!audioContext || startTime === null || audioContext.currentTime < startTime) {
        setCurrentStepIndex(0);
        return;
      }

      const stepDurationSeconds = 15 / bpmRef.current;
      const elapsedSeconds = audioContext.currentTime - startTime;
      const stepIndex =
        Math.floor(elapsedSeconds / stepDurationSeconds) % patternRef.current.length;
      setCurrentStepIndex(stepIndex);
    }, VISUAL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isPlaying]);

  useEffect(
    () => () => {
      stopScheduledNodes();
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    },
    [stopScheduledNodes],
  );

  return {
    currentStepIndex,
    isPlaying,
    startPlayback,
    stopPlayback,
    togglePlayback,
  };
}
