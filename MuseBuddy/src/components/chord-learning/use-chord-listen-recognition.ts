import { useEffect, useRef, useState } from 'react';
import * as Note from '@tonaljs/note';
import * as Haptics from 'expo-haptics';

import { usePerformanceGuidance } from '@/components/performance-guidance';
import { midiToPitchClass, type ChordDisplay } from '@/music-theory';

import {
  getDetectionAttackSignature,
  getRecentDetectionNotes,
  getRecentMidiPitches,
} from './chord-listen-detection';
import {
  getChordListenAttackId,
  markChordListenLiveKeyStatesSuccess,
  updateChordListenLiveKeyStates,
  type ChordListenLiveKeyStates,
} from './chord-listen-live-state';
import { advanceChordListenProgress, findBestChordListenMatchIndex } from './chord-listen-progress';

const NOTE_DECAY_WINDOW_MS = 2_000;
const UNEXPECTED_NOTE_RELEASE_WINDOW_MS = 450;
const COMPLETE_LISTENING_DELAY_MS = 800;
const EMPTY_COMPLETED_CHORD_INDEXES: ReadonlySet<number> = new Set();

export type ChordListenRecognitionState = {
  completedChordIndexes: ReadonlySet<number>;
  errorMessage: string;
  isListening: boolean;
  liveKeys: ChordListenLiveKeyStates;
  noteLabels: readonly string[];
};

type UseChordListenRecognitionOptions = {
  displays: readonly ChordDisplay[];
  enabled?: boolean;
};

type RenderedProgress = {
  chordIndexes: ReadonlySet<number>;
  cycle: number;
  noteLabels: readonly string[];
};

export function useChordListenRecognition({
  displays,
  enabled = true,
}: UseChordListenRecognitionOptions): ChordListenRecognitionState {
  const { completeListening, completedCycles, errorMessage, latestDetection, phase } =
    usePerformanceGuidance();
  const [renderedProgress, setRenderedProgress] = useState<RenderedProgress>(() => ({
    chordIndexes: new Set(),
    cycle: completedCycles,
    noteLabels: [],
  }));
  const completedIndexesRef = useRef(new Set<number>());
  const cycleRef = useRef(completedCycles);
  const lastAttackSignatureRef = useRef('');
  const acceptedRef = useRef(false);
  const seenAttackIdsRef = useRef(new Set<string>());
  const heardExpectedPitchClassesRef = useRef(new Set<number>());
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [liveKeys, setLiveKeys] = useState<ChordListenLiveKeyStates>({});

  useEffect(
    () => () => {
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (cycleRef.current !== completedCycles) {
      cycleRef.current = completedCycles;
      completedIndexesRef.current = new Set();
      lastAttackSignatureRef.current = '';
      acceptedRef.current = false;
      seenAttackIdsRef.current = new Set();
      heardExpectedPitchClassesRef.current = new Set();
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
      setLiveKeys({});
    }

    if (
      phase !== 'listening' ||
      !enabled ||
      !latestDetection ||
      displays.length === 0 ||
      acceptedRef.current
    ) {
      return;
    }

    if (displays.length === 1) {
      const display = displays[0]!;
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

      setLiveKeys((previous) =>
        updateChordListenLiveKeyStates({
          attacks,
          expectedPitchClasses,
          previous,
          unexpectedMidiPitches: activeUnexpectedMidiPitches,
        }),
      );

      for (const attack of attacks) {
        const pitchClass = midiToPitchClass(attack.midiPitch);
        if (expectedPitchClasses.has(pitchClass)) {
          heardExpectedPitchClassesRef.current.add(pitchClass);
        }
      }

      if (
        completionTimerRef.current === null &&
        expectedPitchClasses.size > 0 &&
        [...expectedPitchClasses].every((pitchClass) =>
          heardExpectedPitchClassesRef.current.has(pitchClass),
        )
      ) {
        setLiveKeys((previous) =>
          markChordListenLiveKeyStatesSuccess(previous, expectedPitchClasses),
        );
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        completionTimerRef.current = setTimeout(() => {
          completionTimerRef.current = null;
          void completeListening();
        }, COMPLETE_LISTENING_DELAY_MS);
      }

      setRenderedProgress({
        chordIndexes: completedIndexesRef.current,
        cycle: completedCycles,
        noteLabels: recentNotes.map((note) => Note.fromMidiSharps(note.midiPitch)),
      });
      return;
    }

    const recentNotes = getRecentDetectionNotes(latestDetection, NOTE_DECAY_WINDOW_MS);
    const midiPitches = getRecentMidiPitches(latestDetection, NOTE_DECAY_WINDOW_MS);
    const noteLabels = midiPitches.map((midiPitch) => Note.fromMidiSharps(midiPitch));
    const attackSignature = getDetectionAttackSignature(recentNotes);
    if (!attackSignature || attackSignature === lastAttackSignatureRef.current) {
      setRenderedProgress({
        chordIndexes: completedIndexesRef.current,
        cycle: completedCycles,
        noteLabels,
      });
      return;
    }

    const matchedIndex = findBestChordListenMatchIndex({
      completedChordIndexes: completedIndexesRef.current,
      detectedMidiPitches: midiPitches,
      displays,
    });
    if (matchedIndex === null) {
      setRenderedProgress({
        chordIndexes: completedIndexesRef.current,
        cycle: completedCycles,
        noteLabels,
      });
      return;
    }

    lastAttackSignatureRef.current = attackSignature;
    const progress = advanceChordListenProgress({
      completedChordIndexes: completedIndexesRef.current,
      matchedChordIndex: matchedIndex,
      totalChordCount: displays.length,
    });
    completedIndexesRef.current = new Set(progress.completedChordIndexes);
    setRenderedProgress({
      chordIndexes: completedIndexesRef.current,
      cycle: completedCycles,
      noteLabels,
    });
    if (progress.isComplete) {
      acceptedRef.current = true;
      void completeListening();
    }
  }, [completeListening, completedCycles, displays, enabled, latestDetection, phase]);

  const isCurrentCycle = renderedProgress.cycle === completedCycles;

  return {
    completedChordIndexes:
      (phase === 'listening' || phase === 'finish') && isCurrentCycle
        ? renderedProgress.chordIndexes
        : EMPTY_COMPLETED_CHORD_INDEXES,
    errorMessage,
    isListening: phase === 'listening' && enabled,
    liveKeys: phase === 'listening' && isCurrentCycle ? liveKeys : {},
    noteLabels: phase === 'listening' && isCurrentCycle ? renderedProgress.noteLabels : [],
  };
}
