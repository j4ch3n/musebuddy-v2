import { describe, expect, it } from 'vitest';

import {
  createRhythmListenProgress,
  deriveRhythmListenProgress,
  getRhythmTiming,
  type RhythmDetectedAttack,
} from './rhythm-listen-progress';
import type { RhythmPattern } from './types';

const pattern: RhythmPattern = ['s', null, 'w', 'h'];
const stepDurationMs = 100;
const allowedOffsetMs = 50;
const listeningDurationMs = pattern.length * stepDurationMs;
const listeningStartedAtMs = 10_000;

function derive(attacks: readonly RhythmDetectedAttack[], elapsedMs = 0, startingCombo = 0) {
  return deriveRhythmListenProgress({
    allowedOffsetMs,
    attacks,
    elapsedMs,
    listeningDurationMs,
    listeningStartedAtMs,
    pattern,
    startingCombo,
    stepDurationMs,
  });
}

describe('rhythm listen progress', () => {
  it('derives step, bar, and listening durations from BPM', () => {
    expect(getRhythmTiming(120, 32)).toEqual({
      barDurationMs: 2_000,
      listeningDurationMs: 2_000,
      stepDurationMs: 62.5,
    });
  });

  it('creates expected hits only for strong and weak attacks', () => {
    expect(createRhythmListenProgress(pattern, stepDurationMs).expectedHits).toEqual([
      { matched: false, missed: false, offsetMs: 0, stepIndex: 0 },
      { matched: false, missed: false, offsetMs: 200, stepIndex: 2 },
    ]);
  });

  it('matches absolute attack times to the nearest expected hits', () => {
    const progress = derive(
      [
        { absoluteTimeMs: 10_020, id: 1 },
        { absoluteTimeMs: 10_175, id: 2 },
      ],
      250,
    );

    expect(progress.combo).toBe(2);
    expect(progress.dots).toEqual([
      { attackOffsetMs: 20, id: 1, matched: true },
      { attackOffsetMs: 175, id: 2, matched: true },
    ]);
  });

  it('admits an early first hit within allowance and clamps its dot to step one', () => {
    const progress = derive([{ absoluteTimeMs: 9_960, id: 1 }], 0, 3);

    expect(progress.combo).toBe(4);
    expect(progress.dots).toEqual([{ attackOffsetMs: 0, id: 1, matched: true }]);
    expect(progress.expectedHits[0]).toMatchObject({ matched: true, missed: false });
  });

  it('ignores demo attacks outside the first hit allowance', () => {
    expect(derive([{ absoluteTimeMs: 9_949, id: 1 }]).dots).toEqual([]);
  });

  it('uses one attack per expected hit and retains duplicate attacks as unmatched dots', () => {
    const progress = derive(
      [
        { absoluteTimeMs: 10_000, id: 1 },
        { absoluteTimeMs: 10_010, id: 2 },
      ],
      20,
    );

    expect(progress.combo).toBe(0);
    expect(progress.dots).toEqual([
      { attackOffsetMs: 0, id: 1, matched: true },
      { attackOffsetMs: 10, id: 2, matched: false },
    ]);
  });

  it('repairs a provisional miss when a delayed event carries an in-window onset time', () => {
    const missed = derive([], 60, 4);
    const repaired = derive([{ absoluteTimeMs: 10_020, id: 1 }], 100, 4);

    expect(missed.expectedHits[0]).toMatchObject({ matched: false, missed: true });
    expect(missed.combo).toBe(0);
    expect(repaired.expectedHits[0]).toMatchObject({ matched: true, missed: false });
    expect(repaired.combo).toBe(5);
  });

  it('derives the same bar-two offset from fresh boundaries in later rounds', () => {
    const twoBarPattern: RhythmPattern = [
      ...Array.from<RhythmPattern[number]>({ length: 16 }).fill(null),
      's',
      ...Array.from<RhythmPattern[number]>({ length: 15 }).fill(null),
    ];
    const deriveRound = (roundStartedAtMs: number, id: number) =>
      deriveRhythmListenProgress({
        allowedOffsetMs,
        attacks: [{ absoluteTimeMs: roundStartedAtMs + 1_620, id }],
        elapsedMs: 1_700,
        listeningDurationMs: 3_200,
        listeningStartedAtMs: roundStartedAtMs,
        pattern: twoBarPattern,
        stepDurationMs,
      });

    expect(deriveRound(10_000, 1).dots[0]?.attackOffsetMs).toBe(1_620);
    expect(deriveRound(30_000, 2).dots[0]?.attackOffsetMs).toBe(1_620);
    expect(deriveRound(50_000, 3).dots[0]?.attackOffsetMs).toBe(1_620);
  });
});
