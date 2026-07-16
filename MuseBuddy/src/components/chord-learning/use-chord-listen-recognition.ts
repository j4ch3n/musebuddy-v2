import { useEffect, useRef, useState } from 'react';
import * as Note from '@tonaljs/note';

import { usePerformanceGuidance } from '@/components/performance-guidance';
import type { ChordDisplay } from '@/music-theory';

import {
  getDetectionAttackSignature,
  getRecentDetectionNotes,
  getRecentMidiPitches,
} from './chord-listen-detection';
import { advanceChordListenProgress, findBestChordListenMatchIndex } from './chord-listen-progress';

const NOTE_DECAY_WINDOW_MS = 2_000;
const EMPTY_COMPLETED_CHORD_INDEXES: ReadonlySet<number> = new Set();

export type ChordListenRecognitionState = {
  completedChordIndexes: ReadonlySet<number>;
  errorMessage: string;
  isListening: boolean;
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

  useEffect(() => {
    if (cycleRef.current !== completedCycles) {
      cycleRef.current = completedCycles;
      completedIndexesRef.current = new Set();
      lastAttackSignatureRef.current = '';
      acceptedRef.current = false;
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
    noteLabels: phase === 'listening' && isCurrentCycle ? renderedProgress.noteLabels : [],
  };
}
