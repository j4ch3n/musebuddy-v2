import { describe, expect, it } from 'vitest';

import { createTrainingSession } from '@/contexts/training-session-test-fixture';

import { deriveRhythmFromPatternBeats } from './rhythm-arrangement';

describe('deriveRhythmFromPatternBeats', () => {
  it('derives the entire pattern and keeps the two staves independent', () => {
    const session = createTrainingSession(4);
    const firstBeat = session.notes.beats[0];
    const lastBeat = session.notes.beats[7];
    if (!firstBeat || !lastBeat) {
      throw new Error('Fixture is missing beats.');
    }
    firstBeat.staves.treble.arrangement[0] = [60];
    firstBeat.staves.treble.velocity[0] = [40];
    firstBeat.staves.treble.arrangement[2] = [62];
    firstBeat.staves.treble.velocity[2] = [80];
    lastBeat.staves.bass.arrangement[30] = [48];
    lastBeat.staves.bass.velocity[30] = [70];

    const treble = deriveRhythmFromPatternBeats(session.notes.beats, 'treble');
    const bass = deriveRhythmFromPatternBeats(session.notes.beats, 'bass');

    expect(treble.pattern).toHaveLength(128);
    expect(bass.pattern).toHaveLength(128);
    expect(treble.pattern.slice(0, 3)).toEqual(['w', 's', null]);
    expect(treble.pattern[127]).toBeNull();
    expect(bass.pattern[127]).toBe('w');
  });

  it('extends holds for the same active pitch across compressed steps', () => {
    const session = createTrainingSession();
    const stave = session.notes.beats[0]?.staves.treble;
    if (!stave) {
      throw new Error('Fixture is missing treble.');
    }
    stave.arrangement[0] = [60];
    stave.velocity[0] = [80];
    stave.arrangement[1] = [-50];
    stave.arrangement[2] = [-50];
    stave.arrangement[3] = [-50];

    const rhythm = deriveRhythmFromPatternBeats(session.notes.beats, 'treble');

    expect(rhythm.pattern.slice(0, 3)).toEqual(['w', 'h', null]);
  });
});
