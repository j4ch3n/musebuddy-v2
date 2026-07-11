export type SoundFontInstrument = 'piano' | 'bass' | 'guitar' | 'percussion';

export type SoundFontPlaybackCell = {
  midi: number | null;
  velocity: number | null;
};

export type SoundFontPlaybackStep = SoundFontPlaybackCell[];

export type SoundFontPlaybackTrack = {
  instrument: SoundFontInstrument;
  parts: SoundFontPlaybackStep[][];
};

export type SoundFontPlaybackConfiguration = {
  bpm: number;
  tracks: SoundFontPlaybackTrack[];
};

export type SoundFontLeadInFinishEvent = {
  playbackId: number;
  bpm: number;
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
  onLeadInFinish(event: SoundFontLeadInFinishEvent): void;
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
