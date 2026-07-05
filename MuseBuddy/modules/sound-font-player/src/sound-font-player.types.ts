export type SoundFontInstrument = 'piano';

export type SoundFontPlaybackNote = {
  channel: 0;
  durationSeconds: number;
  id: string;
  midi: number;
  startTimeSeconds: number;
  velocity: number;
};

export type SoundFontPlaybackConfiguration = {
  bpm: 100;
  instrument: SoundFontInstrument;
  notes: SoundFontPlaybackNote[];
  slotDurationSeconds: number;
};

export type SoundFontPlayerErrorCode =
  | 'ERR_SOUNDFONT_ALREADY_PLAYING'
  | 'ERR_SOUNDFONT_EMPTY_CONFIGURATION'
  | 'ERR_SOUNDFONT_ENGINE_START_FAILED'
  | 'ERR_SOUNDFONT_INVALID_CONFIGURATION'
  | 'ERR_SOUNDFONT_LOAD_FAILED'
  | 'ERR_SOUNDFONT_RESOURCE_MISSING'
  | 'ERR_UNSUPPORTED_PLATFORM';
