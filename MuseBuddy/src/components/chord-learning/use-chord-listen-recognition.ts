import { useEffect, useRef, useState } from 'react';

import { usePerformanceGuidance } from '@/components/performance-guidance';
import type { ChordDisplay } from '@/music-theory';

import { getRecentDetectionNotes, getRecentMidiPitches } from './chord-listen-detection';
import {
  getChordListenAttackId,
  updateChordListenLiveKeyStates,
  type ChordListenLiveKeyStates,
} from './chord-listen-live-state';

const NOTE_DECAY_WINDOW_MS = 2_000;
const UNEXPECTED_NOTE_RELEASE_WINDOW_MS = 450;

type UseChordListenRecognitionOptions = {
  display: ChordDisplay | undefined;
  enabled: boolean;
};

type LiveKeyState = {
  completedCycles: number;
  flowId: number;
  keys: ChordListenLiveKeyStates;
};

export function useChordListenRecognition({ display, enabled }: UseChordListenRecognitionOptions): {
  liveKeys: ChordListenLiveKeyStates;
} {
  const { completedCycles, flowId, latestDetection, phase } = usePerformanceGuidance();
  const [liveKeyState, setLiveKeyState] = useState<LiveKeyState>({
    completedCycles: -1,
    flowId: -1,
    keys: {},
  });
  const cycleRef = useRef(completedCycles);
  const seenAttackIdsRef = useRef(new Set<string>());

  useEffect(() => {
    seenAttackIdsRef.current = new Set();
  }, [display?.idName, flowId]);

  useEffect(() => {
    if (cycleRef.current !== completedCycles) {
      cycleRef.current = completedCycles;
      seenAttackIdsRef.current = new Set();
    }

    if (phase !== 'listening' || !enabled || !display || !latestDetection) {
      return;
    }

    const expectedPitchClasses = new Set(display.notes.map((note) => note.pitchClass));
    const recentNotes = getRecentDetectionNotes(latestDetection, NOTE_DECAY_WINDOW_MS);
    const attacks = recentNotes.filter((note) => {
      const attackId = getChordListenAttackId(note);
      if (seenAttackIdsRef.current.has(attackId)) {
        return false;
      }
      seenAttackIdsRef.current.add(attackId);
      return true;
    });
    const activeUnexpectedMidiPitches = getRecentMidiPitches(
      latestDetection,
      UNEXPECTED_NOTE_RELEASE_WINDOW_MS,
    );

    setLiveKeyState((previous) => {
      const isCurrentInput =
        previous.flowId === flowId && previous.completedCycles === completedCycles;
      return {
        completedCycles,
        flowId,
        keys: updateChordListenLiveKeyStates({
          attacks,
          expectedPitchClasses,
          previous: isCurrentInput ? previous.keys : {},
          unexpectedMidiPitches: activeUnexpectedMidiPitches,
        }),
      };
    });
  }, [completedCycles, display, enabled, flowId, latestDetection, phase]);

  return {
    liveKeys:
      phase === 'listening' &&
      enabled &&
      liveKeyState.flowId === flowId &&
      liveKeyState.completedCycles === completedCycles
        ? liveKeyState.keys
        : {},
  };
}
