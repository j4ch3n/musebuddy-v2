import { NativeModule, requireNativeModule } from 'expo';
import { Platform } from 'react-native';

import type {
  BandSoundFontPlaybackConfiguration,
  GrooveSoundFontPlaybackConfiguration,
  SoundFontPlaybackFinishEvent,
  SoundFontPlaybackOptions,
  SoundFontRestartPlaybackOptions,
  SoundFontPlaybackStartResult,
  SoundFontPlayerModuleEvents,
  SoundFontPlayerErrorCode,
} from './sound-font-player.types';

export type {
  BandSoundFontInstrument,
  BandSoundFontPlaybackConfiguration,
  BandSoundFontPlaybackTrack,
  GrooveSoundFontInstrument,
  GrooveSoundFontPlaybackConfiguration,
  GrooveSoundFontPlaybackTrack,
  SoundFontPlaybackCell,
  SoundFontPlaybackConfiguration,
  SoundFontPlaybackFinishEvent,
  SoundFontPlaybackOptions,
  SoundFontPlaybackStartResult,
  SoundFontPlaybackStep,
  SoundFontPlaybackTrack,
  SoundFontPlayerErrorCode,
  SoundFontPlayerModuleEvents,
  SoundFontRestartPlaybackOptions,
} from './sound-font-player.types';

type EventSubscription = {
  remove(): void;
};

declare class NativeSoundFontPlayerModule extends NativeModule<SoundFontPlayerModuleEvents> {
  isPlaying(): boolean;
  playBand(
    configuration: BandSoundFontPlaybackConfiguration,
    options: SoundFontPlaybackOptions,
  ): Promise<SoundFontPlaybackStartResult>;
  playGroove(
    configuration: GrooveSoundFontPlaybackConfiguration,
    options: SoundFontPlaybackOptions,
  ): Promise<SoundFontPlaybackStartResult>;
  restartBand(
    configuration: BandSoundFontPlaybackConfiguration,
    options: SoundFontRestartPlaybackOptions,
  ): Promise<SoundFontPlaybackStartResult>;
  restartGroove(
    configuration: GrooveSoundFontPlaybackConfiguration,
    options: SoundFontRestartPlaybackOptions,
  ): Promise<SoundFontPlaybackStartResult>;
  prepareSoundFonts(): Promise<void>;
  stop(): Promise<void>;
}

type NativeError = Error & {
  code?: string;
};

const errorMessages: Record<SoundFontPlayerErrorCode, string> = {
  ERR_SOUNDFONT_ALREADY_PLAYING: 'The SoundFont player is already playing.',
  ERR_SOUNDFONT_EMPTY_CONFIGURATION: 'There are no playable tracks.',
  ERR_SOUNDFONT_ENGINE_START_FAILED: 'The SoundFont player could not start audio playback.',
  ERR_SOUNDFONT_INVALID_CONFIGURATION: 'The SoundFont playback configuration is invalid.',
  ERR_SOUNDFONT_LOAD_FAILED: 'The SoundFont sound could not be loaded.',
  ERR_SOUNDFONT_RESOURCE_MISSING: 'A bundled SoundFont is missing. Rebuild the development client.',
  ERR_UNSUPPORTED_PLATFORM:
    'SoundFont playback is available only in the MuseBuddy iOS development client.',
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

export function prepareSoundFonts(): Promise<void> {
  return callNative(() => getNativeModule().prepareSoundFonts());
}

export function playBand(
  configuration: BandSoundFontPlaybackConfiguration,
  options: SoundFontPlaybackOptions = {},
): Promise<SoundFontPlaybackStartResult> {
  return callNative(() => getNativeModule().playBand(configuration, normalizeOptions(options)));
}

export function playGroove(
  configuration: GrooveSoundFontPlaybackConfiguration,
  options: SoundFontPlaybackOptions = {},
): Promise<SoundFontPlaybackStartResult> {
  return callNative(() => getNativeModule().playGroove(configuration, normalizeOptions(options)));
}

export function restartBand(
  configuration: BandSoundFontPlaybackConfiguration,
  options: SoundFontRestartPlaybackOptions,
): Promise<SoundFontPlaybackStartResult> {
  return callNative(() => getNativeModule().restartBand(configuration, normalizeOptions(options)));
}

export function restartGroove(
  configuration: GrooveSoundFontPlaybackConfiguration,
  options: SoundFontRestartPlaybackOptions,
): Promise<SoundFontPlaybackStartResult> {
  return callNative(() =>
    getNativeModule().restartGroove(configuration, normalizeOptions(options)),
  );
}

export function stop(): Promise<void> {
  return callNative(() => getNativeModule().stop());
}

export function isPlaying(): boolean {
  return getNativeModule().isPlaying();
}

export function addPlaybackFinishListener(
  listener: (event: SoundFontPlaybackFinishEvent) => void,
): EventSubscription {
  return getNativeModule().addListener('onPlaybackFinish', listener);
}

function normalizeOptions(options: SoundFontPlaybackOptions): Required<SoundFontPlaybackOptions> {
  return {
    leadIn: options.leadIn ?? false,
    cycles: options.cycles ?? 1,
    repeat: options.repeat ?? false,
  };
}
