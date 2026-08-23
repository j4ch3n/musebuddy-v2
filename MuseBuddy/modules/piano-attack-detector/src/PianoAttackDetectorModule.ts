import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';

import type {
  PianoAttackDetectorArtifactFiles,
  PianoAttackDetectorArtifactKind,
  PianoAttackDetectorConfiguration,
  PianoAttackDetectorErrorCode,
  PianoAmbientLevelChangeEvent,
  PianoAttackEvent,
  PianoAttackDetectorModuleEvents,
} from './PianoAttackDetector.types';

export type {
  PianoAttackDetectorArtifactFiles,
  PianoAttackDetectorArtifactKind,
  PianoAttackDetectorConfiguration,
  PianoAttackDetectorErrorCode,
  PianoAmbientLevelChangeEvent,
  PianoAttackEvent,
  PianoAttackDetectorModuleEvents,
} from './PianoAttackDetector.types';

type EventSubscription = {
  remove(): void;
};

export const DEFAULT_PIANO_ATTACK_DETECTOR_CONFIGURATION: PianoAttackDetectorConfiguration = {
  fftSize: 512,
  hopSize: 128,
  highPassCutoffHz: 80,
  minimumFrequency: 100,
  maximumFrequency: 7_500,
  magnitudeCompression: 10,
  thresholdHistorySeconds: 0.75,
  thresholdMultiplier: 3,
  minimumFlux: 0.00002,
  minimumProminence: 0.02,
  minimumThresholdRatio: 1.5,
  minimumRmsRiseDb: 1.5,
  cooldownMs: 120,
  useSquaredFlux: 1,
  normalizeSpectrum: 0,
};

type NativePianoAttackDetectorModule = {
  startListening(configuration: PianoAttackDetectorConfiguration): Promise<void>;
  stopListening(): Promise<void>;
  isListening(): boolean;
  getArtifactFiles(): Promise<PianoAttackDetectorArtifactFiles>;
  shareArtifact(kind: PianoAttackDetectorArtifactKind): Promise<void>;
  addListener<EventName extends keyof PianoAttackDetectorModuleEvents>(
    eventName: EventName,
    listener: PianoAttackDetectorModuleEvents[EventName],
  ): EventSubscription;
};

type NativeError = Error & {
  code?: string;
};

const errorMessages: Record<PianoAttackDetectorErrorCode, string> = {
  ERR_ATTACK_DETECTOR_ALREADY_LISTENING: 'The piano attack detector is already listening.',
  ERR_ATTACK_DETECTOR_ARTIFACT_UNAVAILABLE: 'No piano attack detector file is available yet.',
  ERR_ATTACK_DETECTOR_AUDIO_START_FAILED: 'The piano attack detector could not start audio input.',
  ERR_ATTACK_DETECTOR_NOT_LISTENING: 'The piano attack detector is not listening.',
  ERR_ATTACK_DETECTOR_SHARE_FAILED: 'The piano attack detector could not open the share sheet.',
  ERR_MICROPHONE_PERMISSION_DENIED:
    'Microphone access is required. Enable it for MuseBuddy in Settings.',
  ERR_UNSUPPORTED_PLATFORM:
    'Piano attack detection is available only in the MuseBuddy iOS development client.',
};

export class PianoAttackDetectorError extends Error {
  constructor(
    public readonly code: PianoAttackDetectorErrorCode,
    message: string,
    public readonly nativeMessage?: string,
  ) {
    super(message);
    this.name = 'PianoAttackDetectorError';
  }
}

let nativeModule: NativePianoAttackDetectorModule | null = null;

function getNativeModule(): NativePianoAttackDetectorModule {
  if (Platform.OS !== 'ios') {
    throw new PianoAttackDetectorError(
      'ERR_UNSUPPORTED_PLATFORM',
      errorMessages.ERR_UNSUPPORTED_PLATFORM,
    );
  }

  nativeModule ??= requireNativeModule<NativePianoAttackDetectorModule>('PianoAttackDetector');
  return nativeModule;
}

function mapError(error: unknown): PianoAttackDetectorError {
  if (error instanceof PianoAttackDetectorError) {
    return error;
  }

  const code = (error as NativeError | undefined)?.code as PianoAttackDetectorErrorCode | undefined;
  const nativeMessage = error instanceof Error ? error.message : String(error);
  if (code && code in errorMessages) {
    return new PianoAttackDetectorError(code, errorMessages[code], nativeMessage);
  }

  return new PianoAttackDetectorError(
    'ERR_ATTACK_DETECTOR_AUDIO_START_FAILED',
    errorMessages.ERR_ATTACK_DETECTOR_AUDIO_START_FAILED,
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

export function startListening(
  configuration: Partial<PianoAttackDetectorConfiguration> = {},
): Promise<void> {
  return callNative(() =>
    getNativeModule().startListening({
      ...DEFAULT_PIANO_ATTACK_DETECTOR_CONFIGURATION,
      ...configuration,
    }),
  );
}

export function stopListening(): Promise<void> {
  return callNative(() => getNativeModule().stopListening());
}

export function isListening(): boolean {
  return getNativeModule().isListening();
}

export function getArtifactFiles(): Promise<PianoAttackDetectorArtifactFiles> {
  return callNative(() => getNativeModule().getArtifactFiles());
}

export function shareArtifact(kind: PianoAttackDetectorArtifactKind): Promise<void> {
  return callNative(() => getNativeModule().shareArtifact(kind));
}

export function addAttackListener(listener: (event: PianoAttackEvent) => void): EventSubscription {
  return getNativeModule().addListener('onAttack', listener);
}

export function addReleaseListener(listener: (event: PianoAttackEvent) => void): EventSubscription {
  return getNativeModule().addListener('onRelease', listener);
}

export function addAmbientLevelChangeListener(
  listener: (event: PianoAmbientLevelChangeEvent) => void,
): EventSubscription {
  return getNativeModule().addListener('onAmbientLevelChange', listener);
}
