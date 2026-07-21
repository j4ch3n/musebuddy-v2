export type RhythmStep = 's' | 'w' | 'h' | null;
export type RhythmPattern = readonly RhythmStep[];

export type RhythmAttack = Exclude<RhythmStep, 'h' | null>;

export type RhythmAttackDot = {
  attackOffsetMs: number;
  id: number;
  matched: boolean;
};
