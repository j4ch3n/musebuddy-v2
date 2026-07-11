export type BandSoundFontInstrument = 'piano' | 'bass' | 'guitar' | 'percussion';

export type GrooveSoundFontInstrument = 'percussion';

export type SoundFontPlaybackCell = {
  midi: number | null;
  velocity: number | null;
};

export type SoundFontPlaybackStep = SoundFontPlaybackCell[];

export type SoundFontPlaybackTrack<TInstrument extends string = string> = {
  instrument: TInstrument;
  parts: SoundFontPlaybackStep[][];
};

export type SoundFontPlaybackConfiguration<TInstrument extends string = string> = {
  bpm: number;
  cycleCount?: number;
  includesSilentPeriod?: boolean;
  tracks: SoundFontPlaybackTrack<TInstrument>[];
};

export type BandSoundFontPlaybackTrack = SoundFontPlaybackTrack<BandSoundFontInstrument>;

export type BandSoundFontPlaybackConfiguration =
  SoundFontPlaybackConfiguration<BandSoundFontInstrument>;

export type GrooveSoundFontPlaybackTrack = SoundFontPlaybackTrack<GrooveSoundFontInstrument>;

export type GrooveSoundFontPlaybackConfiguration =
  SoundFontPlaybackConfiguration<GrooveSoundFontInstrument>;

export type SoundFontLeadInFinishEvent = {
  playbackId: number;
  bpm: number;
};

export type SoundFontDemoFinishEvent = {
  playbackId: number;
  bpm: number;
  cycleIndex: number;
  completedCycleCount: number;
  includesSilentPeriod: boolean;
};

export type SoundFontCycleRepeatEvent = {
  playbackId: number;
  bpm: number;
  cycleIndex: number;
  completedCycleCount: number;
  includesSilentPeriod: boolean;
  willRepeat: boolean;
};

export type SoundFontStepEvent = {
  playbackId: number;
  bpm: number;
  stepIndex: number;
  barIndex: number;
  stepIndexInBar: number;
};

export type SoundFontTickEvent =
  | {
      playbackId: number;
      bpm: number;
      event: 'beat';
      beatIndex: number;
    }
  | {
      playbackId: number;
      bpm: number;
      event: 'bar';
      barIndex: number;
    };

export type SoundFontPlayerModuleEvents = {
  onCycleRepeat(event: SoundFontCycleRepeatEvent): void;
  onDemoFinish(event: SoundFontDemoFinishEvent): void;
  onLeadInFinish(event: SoundFontLeadInFinishEvent): void;
  onStep(event: SoundFontStepEvent): void;
  onTick(event: SoundFontTickEvent): void;
};

export type SoundFontPlayerErrorCode =
  | 'ERR_SOUNDFONT_ALREADY_PLAYING'
  | 'ERR_SOUNDFONT_EMPTY_CONFIGURATION'
  | 'ERR_SOUNDFONT_ENGINE_START_FAILED'
  | 'ERR_SOUNDFONT_INVALID_CONFIGURATION'
  | 'ERR_SOUNDFONT_LOAD_FAILED'
  | 'ERR_SOUNDFONT_RESOURCE_MISSING'
  | 'ERR_UNSUPPORTED_PLATFORM';
