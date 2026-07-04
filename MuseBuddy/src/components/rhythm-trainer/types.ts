export type RhythmStep = 's' | 'w' | 'h' | null;
export type RhythmPattern = readonly RhythmStep[];

export type RhythmAttack = Exclude<RhythmStep, 'h' | null>;
