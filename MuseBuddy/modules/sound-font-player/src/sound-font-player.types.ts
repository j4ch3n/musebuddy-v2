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
  tracks: SoundFontPlaybackTrack<TInstrument>[];
};

export type SoundFontPlaybackOptions = {
  leadIn?: boolean;
  cycles?: number;
  repeat?: boolean;
};

export type SoundFontRestartPlaybackOptions = SoundFontPlaybackOptions & {
  leadIn: boolean;
};

export type SoundFontPlaybackStartResult = {
  playbackId: number;
};

export type BandSoundFontPlaybackTrack = SoundFontPlaybackTrack<BandSoundFontInstrument>;

export type BandSoundFontPlaybackConfiguration =
  SoundFontPlaybackConfiguration<BandSoundFontInstrument>;

export type GrooveSoundFontPlaybackTrack = SoundFontPlaybackTrack<GrooveSoundFontInstrument>;

export type GrooveSoundFontPlaybackConfiguration =
  SoundFontPlaybackConfiguration<GrooveSoundFontInstrument>;

export type SoundFontPlaybackFinishEvent = {
  playbackId: number;
  bpm: number;
  completedCycles: number;
};

export type SoundFontPlayerModuleEvents = {
  onPlaybackFinish(event: SoundFontPlaybackFinishEvent): void;
};

export type SoundFontPlayerErrorCode =
  | 'ERR_SOUNDFONT_ALREADY_PLAYING'
  | 'ERR_SOUNDFONT_EMPTY_CONFIGURATION'
  | 'ERR_SOUNDFONT_ENGINE_START_FAILED'
  | 'ERR_SOUNDFONT_INVALID_CONFIGURATION'
  | 'ERR_SOUNDFONT_LOAD_FAILED'
  | 'ERR_SOUNDFONT_RESOURCE_MISSING'
  | 'ERR_UNSUPPORTED_PLATFORM';
