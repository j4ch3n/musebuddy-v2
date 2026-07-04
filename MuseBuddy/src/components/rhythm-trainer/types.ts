export type RhythmStep = 's' | 'w' | null;
export type RhythmPattern = readonly RhythmStep[];

export type RhythmAttack = Exclude<RhythmStep, null>;
