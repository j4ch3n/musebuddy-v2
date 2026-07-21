export type SoundFontPlaybackCell = {
  midi: number | null;
  velocity: number | null;
};

export type SoundFontPlaybackStep = SoundFontPlaybackCell[];

export type SoundFontPlaybackConfiguration = {
  bpm: number;
  parts: SoundFontPlaybackStep[][];
};

export type SoundFontPlaybackOptions = {
  keepAudioSessionActive?: boolean;
  leadIn?: boolean;
  repetitions?: number;
};

export type SoundFontPlaybackStartResult = {
  playbackId: number;
  startedAtMs: number;
};

export type SoundFontPlaybackFinishEvent = {
  playbackId: number;
};

export type SoundFontPlayerModuleEvents = {
  onPlaybackFinish(event: SoundFontPlaybackFinishEvent): void;
};

export type SoundFontPlayerErrorCode =
  | 'ERR_SOUNDFONT_EMPTY_CONFIGURATION'
  | 'ERR_SOUNDFONT_ENGINE_START_FAILED'
  | 'ERR_SOUNDFONT_INVALID_CONFIGURATION'
  | 'ERR_SOUNDFONT_LOAD_FAILED'
  | 'ERR_SOUNDFONT_RESOURCE_MISSING'
  | 'ERR_UNSUPPORTED_PLATFORM';
