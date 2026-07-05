import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';

import type {
  SoundFontPlaybackConfiguration,
  SoundFontPlayerErrorCode,
} from './sound-font-player.types';

export type {
  SoundFontInstrument,
  SoundFontPlaybackConfiguration,
  SoundFontPlaybackNote,
  SoundFontPlayerErrorCode,
} from './sound-font-player.types';

type NativeSoundFontPlayerModule = {
  isPlaying(): boolean;
  play(configuration: SoundFontPlaybackConfiguration): Promise<void>;
  stop(): Promise<void>;
};

type NativeError = Error & {
  code?: string;
};

const errorMessages: Record<SoundFontPlayerErrorCode, string> = {
  ERR_SOUNDFONT_ALREADY_PLAYING: 'The piano player is already playing.',
  ERR_SOUNDFONT_EMPTY_CONFIGURATION: 'There are no notes to play.',
  ERR_SOUNDFONT_ENGINE_START_FAILED: 'The piano player could not start audio playback.',
  ERR_SOUNDFONT_INVALID_CONFIGURATION: 'The piano playback configuration is invalid.',
  ERR_SOUNDFONT_LOAD_FAILED: 'The piano sound could not be loaded.',
  ERR_SOUNDFONT_RESOURCE_MISSING:
    'The bundled piano sound is missing. Rebuild the development client.',
  ERR_UNSUPPORTED_PLATFORM:
    'Piano playback is available only in the MuseBuddy iOS development client.',
};

export class SoundFontPlayerError extends Error {
  constructor(
    public readonly code: SoundFontPlayerErrorCode,
    message: string,
    public readonly nativeMessage?: string,
  ) {
    super(message);
    this.name = 'SoundFontPlayerError';
  }
}

let nativeModule: NativeSoundFontPlayerModule | null = null;

function getNativeModule(): NativeSoundFontPlayerModule {
  if (Platform.OS !== 'ios') {
    throw new SoundFontPlayerError(
      'ERR_UNSUPPORTED_PLATFORM',
      errorMessages.ERR_UNSUPPORTED_PLATFORM,
    );
  }

  nativeModule ??= requireNativeModule<NativeSoundFontPlayerModule>('SoundFontPlayer');
  return nativeModule;
}

function mapError(error: unknown): SoundFontPlayerError {
  if (error instanceof SoundFontPlayerError) {
    return error;
  }

  const code = (error as NativeError | undefined)?.code as SoundFontPlayerErrorCode | undefined;
  const nativeMessage = error instanceof Error ? error.message : String(error);
  if (code && code in errorMessages) {
    return new SoundFontPlayerError(code, errorMessages[code], nativeMessage);
  }

  return new SoundFontPlayerError(
    'ERR_SOUNDFONT_ENGINE_START_FAILED',
    errorMessages.ERR_SOUNDFONT_ENGINE_START_FAILED,
    nativeMessage,
  );
}

async function callNative<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw mapError(error);
  }
}

export function play(configuration: SoundFontPlaybackConfiguration): Promise<void> {
  return callNative(() => getNativeModule().play(configuration));
}

export function stop(): Promise<void> {
  return callNative(() => getNativeModule().stop());
}

export function isPlaying(): boolean {
  return getNativeModule().isPlaying();
}
