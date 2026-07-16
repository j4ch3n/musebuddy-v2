import { NativeModule, requireNativeModule } from 'expo';
import { Platform } from 'react-native';

import type {
  SoundFontPlaybackConfiguration,
  SoundFontPlaybackFinishEvent,
  SoundFontPlaybackOptions,
  SoundFontPlaybackStartResult,
  SoundFontPlayerErrorCode,
  SoundFontPlayerModuleEvents,
} from './sound-font-player.types';

export type {
  SoundFontPlaybackCell,
  SoundFontPlaybackConfiguration,
  SoundFontPlaybackFinishEvent,
  SoundFontPlaybackOptions,
  SoundFontPlaybackStartResult,
  SoundFontPlaybackStep,
  SoundFontPlayerErrorCode,
  SoundFontPlayerModuleEvents,
} from './sound-font-player.types';

type EventSubscription = {
  remove(): void;
};

declare class NativeSoundFontPlayerModule extends NativeModule<SoundFontPlayerModuleEvents> {
  playPiano(
    configuration: SoundFontPlaybackConfiguration,
    options: Required<SoundFontPlaybackOptions>,
  ): Promise<SoundFontPlaybackStartResult>;
  playGroove(
    configuration: SoundFontPlaybackConfiguration,
    options: Required<SoundFontPlaybackOptions>,
  ): Promise<SoundFontPlaybackStartResult>;
  stop(playbackId: number): Promise<void>;
}

type NativeError = Error & { code?: string };

const errorMessages: Record<SoundFontPlayerErrorCode, string> = {
  ERR_SOUNDFONT_EMPTY_CONFIGURATION: 'There are no playable parts.',
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

function normalizeOptions(options: SoundFontPlaybackOptions): Required<SoundFontPlaybackOptions> {
  return {
    leadIn: options.leadIn ?? false,
    repetitions: Math.max(1, options.repetitions ?? 1),
  };
}

export function playPiano(
  configuration: SoundFontPlaybackConfiguration,
  options: SoundFontPlaybackOptions = {},
): Promise<SoundFontPlaybackStartResult> {
  return callNative(() => getNativeModule().playPiano(configuration, normalizeOptions(options)));
}

export function playGroove(
  configuration: SoundFontPlaybackConfiguration,
  options: SoundFontPlaybackOptions = {},
): Promise<SoundFontPlaybackStartResult> {
  return callNative(() => getNativeModule().playGroove(configuration, normalizeOptions(options)));
}

export function stop(playbackId: number): Promise<void> {
  return callNative(() => getNativeModule().stop(playbackId));
}

export function addPlaybackFinishListener(
  listener: (event: SoundFontPlaybackFinishEvent) => void,
): EventSubscription {
  return getNativeModule().addListener('onPlaybackFinish', listener);
}
