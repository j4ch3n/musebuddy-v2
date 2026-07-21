import { describe, expect, it } from 'vitest';

import { trainingSessionSchema } from './training-session-schema';

const emptySlots = () =>
  Array.from({ length: 32 }, () => [
    {
      midi: null,
      velocity: null,
    },
  ]);

const validSession = {
  chords: [
    {
      displayTokens: [
        { type: 'root', value: 'A' },
        { type: 'addition', value: 'add9' },
      ],
      idName: 'a-add9',
      normalizedSymbol: 'Aadd9',
      root: 'A',
      tones: [
        {
          degree: '1',
          explanation: 'is the root. It names and anchors the chord.',
          importance: 'essential',
          pitch: 'A',
          pitchClass: 9,
        },
        {
          degree: '3',
          explanation: 'is the third. It gives the chord its major color.',
          importance: 'essential',
          pitch: 'C#',
          pitchClass: 1,
        },
        {
          degree: '5',
          explanation: 'is the fifth. It makes the chord feel stable.',
          importance: 'supporting',
          pitch: 'E',
          pitchClass: 4,
        },
        {
          degree: '9',
          explanation: 'is the ninth. It adds color.',
          importance: 'color',
          pitch: 'B',
          pitchClass: 11,
        },
      ],
    },
  ],
  keyArrangement: {
    rows: [
      {
        beatIndex: 0,
        slots: emptySlots(),
      },
      {
        beatIndex: 1,
        slots: emptySlots(),
      },
    ],
  },
};

describe('trainingSessionSchema', () => {
  it('accepts the edge function session payload', () => {
    expect(trainingSessionSchema.safeParse(validSession).success).toBe(true);
  });

  it('requires full raw key arrangement rows', () => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      keyArrangement: {
        ...validSession.keyArrangement,
        rows: [
          {
            beatIndex: 0,
            slots: emptySlots(),
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects hold cells with velocity', () => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      keyArrangement: {
        ...validSession.keyArrangement,
        rows: [
          {
            beatIndex: 0,
            slots: [
              [
                {
                  midi: -50,
                  velocity: 80,
                },
              ],
              ...emptySlots().slice(1),
            ],
          },
          validSession.keyArrangement.rows[1],
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects attack cells without velocity', () => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      keyArrangement: {
        ...validSession.keyArrangement,
        rows: [
          {
            beatIndex: 0,
            slots: [
              [
                {
                  midi: 60,
                  velocity: null,
                },
              ],
              ...emptySlots().slice(1),
            ],
          },
          validSession.keyArrangement.rows[1],
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects non-hold negative MIDI cells', () => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      keyArrangement: {
        ...validSession.keyArrangement,
        rows: [
          {
            beatIndex: 0,
            slots: [
              [
                {
                  midi: -1,
                  velocity: null,
                },
              ],
              ...emptySlots().slice(1),
            ],
          },
          validSession.keyArrangement.rows[1],
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it.each([
    ['a negative value', -1],
    ['a value above 11', 12],
    ['a non-integer value', 1.5],
  ])('rejects a tone pitch class with %s', (_, pitchClass) => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      chords: [
        {
          ...validSession.chords[0],
          tones: [
            { ...validSession.chords[0].tones[0], pitchClass },
            ...validSession.chords[0].tones.slice(1),
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it.each(['', 'H', 'C###', 'flat C'])('rejects malformed tone pitch %j', (pitch) => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      chords: [
        {
          ...validSession.chords[0],
          tones: [
            { ...validSession.chords[0].tones[0], pitch },
            ...validSession.chords[0].tones.slice(1),
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects unsupported tone importance', () => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      chords: [
        {
          ...validSession.chords[0],
          tones: [
            ...validSession.chords[0].tones.slice(0, 3),
            { ...validSession.chords[0].tones[3], importance: 'decorative' },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects chords without tone explanations', () => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      chords: [
        {
          ...validSession.chords[0],
          tones: [],
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
