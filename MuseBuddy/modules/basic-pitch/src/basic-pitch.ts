import { NativeModule, requireNativeModule } from 'expo';
import { Platform } from 'react-native';

import type {
  BasicPitchErrorCode,
  BasicPitchModuleEvents,
  DetectionResult,
  RecognitionOptions,
  RecognitionStartResult,
} from './basic-pitch.types';

export type {
  BasicPitchErrorCode,
  BasicPitchModuleEvents,
  DetectionNote,
  DetectionResult,
  RecognitionOptions,
  RecognitionStartResult,
} from './basic-pitch.types';

type EventSubscription = {
  remove(): void;
};

declare class NativeBasicPitchModule extends NativeModule<BasicPitchModuleEvents> {
  initialize(): Promise<void>;
  startRecognition(options: Required<RecognitionOptions>): Promise<RecognitionStartResult>;
  cancelRecognition(recognitionId: number): Promise<void>;
  stopRecognition(recognitionId: number): Promise<DetectionResult>;
  shareRecording(): Promise<void>;
  isRecognizing(): boolean;
}

type NativeError = Error & {
  code?: string;
};

export class BasicPitchError extends Error {
  constructor(
    public readonly code: BasicPitchErrorCode,
    message: string,
    public readonly nativeMessage?: string,
  ) {
    super(message);
    this.name = 'BasicPitchError';
  }
}

const errorMessages: Record<BasicPitchErrorCode, string> = {
  ERR_MODEL_RESOURCE_MISSING:
    'The bundled transcription model is missing. Rebuild the development client.',
  ERR_MODEL_LOAD_FAILED: 'The transcription model could not be loaded.',
  ERR_MODEL_VALIDATION_FAILED: 'The bundled transcription model is incompatible.',
  ERR_AUDIO_CONVERSION_FAILED: 'The recording could not be prepared for transcription.',
  ERR_AUDIO_TOO_SHORT: 'Record for at least two seconds before stopping.',
  ERR_INFERENCE_FAILED: 'The recording could not be transcribed.',
  ERR_MICROPHONE_PERMISSION_DENIED:
    'Microphone access is required. Enable it for MuseBuddy in Settings.',
  ERR_AUDIO_START_FAILED: 'The microphone could not start.',
  ERR_ALREADY_RECOGNIZING: 'Basic Pitch recognition is already running.',
  ERR_NOT_RECOGNIZING: 'Basic Pitch recognition is not running.',
  ERR_RECORDING_UNAVAILABLE: 'No completed recording is available to download.',
  ERR_SHARE_FAILED: 'The recording could not be opened for download.',
  ERR_UNSUPPORTED_PLATFORM:
    'On-device transcription is available only in the MuseBuddy iOS development client.',
};

let nativeModule: NativeBasicPitchModule | null = null;

function getNativeModule(): NativeBasicPitchModule {
  if (Platform.OS !== 'ios') {
    throw new BasicPitchError('ERR_UNSUPPORTED_PLATFORM', errorMessages.ERR_UNSUPPORTED_PLATFORM);
  }

  nativeModule ??= requireNativeModule<NativeBasicPitchModule>('BasicPitch');
  return nativeModule;
}

function mapError(error: unknown): BasicPitchError {
  if (error instanceof BasicPitchError) {
    return error;
  }

  const code = (error as NativeError | undefined)?.code as BasicPitchErrorCode | undefined;
  const nativeMessage = error instanceof Error ? error.message : String(error);
  if (code && code in errorMessages) {
    return new BasicPitchError(code, errorMessages[code], nativeMessage);
  }

  return new BasicPitchError(
    'ERR_INFERENCE_FAILED',
    errorMessages.ERR_INFERENCE_FAILED,
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

export function initialize(): Promise<void> {
  return callNative(() => getNativeModule().initialize());
}

export function startRecognition(
  options: RecognitionOptions = {},
): Promise<RecognitionStartResult> {
  return callNative(() =>
    getNativeModule().startRecognition({
      detectionIntervalMs: options.detectionIntervalMs ?? 500,
      rollingWindowMs: options.rollingWindowMs ?? 2_900,
    }),
  );
}

export function cancelRecognition(recognitionId: number): Promise<void> {
  return callNative(() => getNativeModule().cancelRecognition(recognitionId));
}

export function stopRecognition(recognitionId: number): Promise<DetectionResult> {
  return callNative(() => getNativeModule().stopRecognition(recognitionId));
}

export function shareRecording(): Promise<void> {
  return callNative(() => getNativeModule().shareRecording());
}

export function isRecognizing(): boolean {
  return getNativeModule().isRecognizing();
}

export function addDetectionFinishListener(
  listener: (event: DetectionResult) => void,
): EventSubscription {
  return getNativeModule().addListener('onDetectionFinish', listener);
}
