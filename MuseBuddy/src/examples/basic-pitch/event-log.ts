import type { DetectionNote } from '@modules/basic-pitch';

export type MidiNoteGroup = {
  id: string;
  midiPitch: number;
  count: number;
  firstAttackMs: number;
  lastReleaseMs: number;
  averageConfidence: number;
  peakConfidence: number;
  peakVelocity: number;
  events: DetectionNote[];
};

function milliseconds(value: number): string {
  return `${(value / 1_000).toFixed(3)}s`;
}

export function groupDetectionNotesByMidi(notes: DetectionNote[]): MidiNoteGroup[] {
  const groups = new Map<number, DetectionNote[]>();

  for (const note of notes) {
    groups.set(note.midiPitch, [...(groups.get(note.midiPitch) ?? []), note]);
  }

  return [...groups.entries()]
    .map(([midiPitch, events]) => {
      const sortedEvents = [...events].sort((a, b) => {
        if (a.startTimeMs === b.startTimeMs) {
          return a.endTimeMs - b.endTimeMs;
        }
        return a.startTimeMs - b.startTimeMs;
      });
      const confidenceTotal = sortedEvents.reduce((total, note) => total + note.confidence, 0);

      return {
        averageConfidence: confidenceTotal / sortedEvents.length,
        count: sortedEvents.length,
        events: sortedEvents,
        firstAttackMs: Math.min(...sortedEvents.map((note) => note.startTimeMs)),
        id: `midi-${midiPitch}`,
        lastReleaseMs: Math.max(...sortedEvents.map((note) => note.endTimeMs)),
        midiPitch,
        peakConfidence: Math.max(...sortedEvents.map((note) => note.confidence)),
        peakVelocity: Math.max(...sortedEvents.map((note) => note.velocity)),
      };
    })
    .sort((a, b) => {
      if (a.firstAttackMs === b.firstAttackMs) {
        return a.midiPitch - b.midiPitch;
      }
      return a.firstAttackMs - b.firstAttackMs;
    });
}

export function formatDetectionNote(note: DetectionNote): string {
  const confidence = `${Math.round(note.confidence * 100)}%`;
  return `[${milliseconds(note.startTimeMs)}-${milliseconds(note.endTimeMs)}] #${note.id} MIDI ${note.midiPitch} · confidence ${confidence} · velocity ${note.velocity}`;
}

export function formatMilliseconds(value: number): string {
  return milliseconds(value);
}
