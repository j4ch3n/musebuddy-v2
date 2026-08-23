import { describe, expect, it } from 'vitest';

import { prepareTrainingSessionDisplay } from '@/music-theory';

import { createTrainingSession } from './training-session-test-fixture';
import {
  getNextTrainingSessionTransition,
  getSkipTrainingSectionTransition,
  getTrainingSectionScreenIds,
} from './training-session-flow';

describe('training session flow', () => {
  const session = prepareTrainingSessionDisplay(createTrainingSession());

  it('registers each chord as a chord-learning screen', () => {
    expect(getTrainingSectionScreenIds({ sectionId: 'chords', session })).toEqual(
      session.chordDisplays.map((_, index) => `chord:${index}`),
    );
  });

  it('advances from the last chord directly to the next section', () => {
    expect(
      getNextTrainingSessionTransition({ screenId: 'chord:0', sectionId: 'chords', session }),
    ).toEqual({ href: '/rhythm-training-treble', kind: 'section' });
  });

  it('uses right rhythm, then left rhythm, then improvisation', () => {
    expect(
      getNextTrainingSessionTransition({
        screenId: 'rhythm-treble',
        sectionId: 'rhythm-treble',
        session,
      }),
    ).toEqual({ href: '/rhythm-training-bass', kind: 'section' });
    expect(
      getNextTrainingSessionTransition({
        screenId: 'rhythm-bass',
        sectionId: 'rhythm-bass',
        session,
      }),
    ).toEqual({ href: '/improvise', kind: 'section' });
  });

  it('skips all remaining screens in the active section', () => {
    expect(getSkipTrainingSectionTransition({ sectionId: 'chords' })).toEqual({
      href: '/rhythm-training-treble',
      kind: 'section',
    });
  });

  it('routes the final section to congratulations for completion and skip', () => {
    expect(
      getNextTrainingSessionTransition({ screenId: 'improvise', sectionId: 'improvise', session }),
    ).toEqual({ href: '/congrats', kind: 'section' });
    expect(getSkipTrainingSectionTransition({ sectionId: 'improvise' })).toEqual({
      href: '/congrats',
      kind: 'section',
    });
  });
});
