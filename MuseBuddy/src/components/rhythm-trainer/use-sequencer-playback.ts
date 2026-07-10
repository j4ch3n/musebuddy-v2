import { useCallback, useEffect, useRef, useState } from 'react';

import { buildRhythmSoundFontPlaybackConfiguration } from '@/music-theory/sound-font-playback';

import {
  stop as stopSoundFontPlayback,
  play,
  SoundFontPlayerError,
} from '../../../modules/sound-font-player';
import type { RhythmPattern } from './types';

type UseSequencerPlaybackOptions = {
  bpm: number;
  pattern: RhythmPattern;
};

const VISUAL_INTERVAL_MS = 30;

export function useSequencerPlayback({ bpm, pattern }: UseSequencerPlaybackOptions) {
  const startTimeRef = useRef(0);
  const patternRef = useRef(pattern);
  const bpmRef = useRef(bpm);
  const previousBpmRef = useRef(bpm);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopPlayback = useCallback(() => {
    void stopSoundFontPlayback();
    setIsPlaying(false);
    setCurrentStepIndex(null);
  }, []);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  const startPlayback = useCallback(async () => {
    if (patternRef.current.length === 0) {
      return;
    }

    const configuration = buildRhythmSoundFontPlaybackConfiguration(
      patternRef.current,
      bpmRef.current,
    );
    await play(configuration);
    startTimeRef.current = Date.now();
    setCurrentStepIndex(0);
    setIsPlaying(true);
  }, []);

  const restartPlayback = useCallback(async () => {
    if (patternRef.current.length === 0) {
      return;
    }

    try {
      await play(buildRhythmSoundFontPlaybackConfiguration(patternRef.current, bpmRef.current));
      startTimeRef.current = Date.now();
      setCurrentStepIndex(0);
    } catch (error) {
      setIsPlaying(false);
      setCurrentStepIndex(null);
      throw error;
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    void startPlayback().catch((error: unknown) => {
      if (__DEV__) {
        const detail = error instanceof SoundFontPlayerError ? error.nativeMessage : undefined;
        console.warn('Rhythm playback failed.', detail ?? error);
      }
      setIsPlaying(false);
      setCurrentStepIndex(null);
    });
  }, [isPlaying, startPlayback, stopPlayback]);

  useEffect(() => {
    const didChangeBpm = previousBpmRef.current !== bpm;

    bpmRef.current = bpm;
    previousBpmRef.current = bpm;

    if (!isPlaying || !didChangeBpm) {
      return;
    }

    void restartPlayback().catch((error: unknown) => {
      if (__DEV__) {
        const detail = error instanceof SoundFontPlayerError ? error.nativeMessage : undefined;
        console.warn('Rhythm playback restart failed.', detail ?? error);
      }
      setIsPlaying(false);
      setCurrentStepIndex(null);
    });
  }, [bpm, isPlaying, restartPlayback]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const intervalId = setInterval(() => {
      const startTime = startTimeRef.current;
      const patternLength = patternRef.current.length;

      if (patternLength === 0) {
        stopPlayback();
        return;
      }

      const stepDurationSeconds = 15 / bpmRef.current;
      const elapsedSeconds = (Date.now() - startTime) / 1_000;
      const stepIndex = Math.floor(elapsedSeconds / stepDurationSeconds) % patternLength;
      setCurrentStepIndex(stepIndex);
    }, VISUAL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isPlaying, stopPlayback]);

  useEffect(
    () => () => {
      void stopSoundFontPlayback();
    },
    [],
  );

  return {
    currentStepIndex,
    isPlaying,
    startPlayback,
    stopPlayback,
    togglePlayback,
  };
}
