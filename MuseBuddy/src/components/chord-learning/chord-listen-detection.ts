type TimedMidiNote = {
  endTimeMs: number;
  midiPitch: number;
  startTimeMs: number;
};

type TimedMidiDetection = {
  notes: readonly TimedMidiNote[];
  windowEndMs: number;
};

export function getRecentMidiPitches(
  detection: TimedMidiDetection,
  decayWindowMs: number,
): number[] {
  const recentNotes = getRecentDetectionNotes(detection, decayWindowMs);

  return Array.from(new Set(recentNotes.map((note) => note.midiPitch))).sort(
    (left, right) => left - right,
  );
}

export function getRecentDetectionNotes(
  detection: TimedMidiDetection,
  decayWindowMs: number,
): TimedMidiNote[] {
  const cutoffTimeMs = detection.windowEndMs - decayWindowMs;

  return detection.notes
    .filter((note) => note.endTimeMs > cutoffTimeMs)
    .sort((left, right) => {
      if (left.startTimeMs === right.startTimeMs) {
        return left.midiPitch - right.midiPitch;
      }

      return left.startTimeMs - right.startTimeMs;
    });
}

export function getDetectionAttackSignature(notes: readonly TimedMidiNote[]): string {
  return notes.map((note) => `${note.midiPitch}:${note.startTimeMs}`).join('|');
}
