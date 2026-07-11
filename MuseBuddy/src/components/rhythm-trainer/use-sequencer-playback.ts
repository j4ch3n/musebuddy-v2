import { useCallback, useEffect, useRef, useState } from 'react';

import { buildRhythmSoundFontPlaybackConfiguration } from '@/music-theory/sound-font-playback';

import {
  addLeadInFinishListener,
  addStepListener,
  stop as stopSoundFontPlayback,
  SoundFontPlayerError,
  playGroove,
} from '@modules/sound-font-player/src/sound-font-player';
import type { RhythmPattern } from './types';

type UseSequencerPlaybackOptions = {
  bpm: number;
  pattern: RhythmPattern;
};

export function useSequencerPlayback({ bpm, pattern }: UseSequencerPlaybackOptions) {
  const patternRef = useRef(pattern);
  const bpmRef = useRef(bpm);
  const didFinishLeadInRef = useRef(false);
  const previousBpmRef = useRef(bpm);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopPlayback = useCallback(() => {
    void stopSoundFontPlayback();
    didFinishLeadInRef.current = false;
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
    await playGroove(configuration);
    didFinishLeadInRef.current = false;
    setCurrentStepIndex(null);
    setIsPlaying(true);
  }, []);

  const restartPlayback = useCallback(async () => {
    if (patternRef.current.length === 0) {
      return;
    }

    try {
      await playGroove(
        buildRhythmSoundFontPlaybackConfiguration(patternRef.current, bpmRef.current),
      );
      didFinishLeadInRef.current = false;
      setCurrentStepIndex(null);
    } catch (error) {
      didFinishLeadInRef.current = false;
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
      didFinishLeadInRef.current = false;
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
      didFinishLeadInRef.current = false;
      setIsPlaying(false);
      setCurrentStepIndex(null);
    });
  }, [bpm, isPlaying, restartPlayback]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const leadInSubscription = addLeadInFinishListener(() => {
      didFinishLeadInRef.current = true;
    });
    const stepSubscription = addStepListener((event) => {
      const patternLength = patternRef.current.length;

      if (patternLength === 0) {
        stopPlayback();
        return;
      }

      if (!didFinishLeadInRef.current) {
        didFinishLeadInRef.current = true;
      }
      setCurrentStepIndex(event.stepIndex % patternLength);
    });

    return () => {
      leadInSubscription.remove();
      stepSubscription.remove();
    };
  }, [isPlaying, stopPlayback]);

  useEffect(
    () => () => {
      didFinishLeadInRef.current = false;
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
