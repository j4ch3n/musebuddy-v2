export type DetectionNote = {
  id: number;
  midiPitch: number;
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  confidence: number;
  velocity: number;
};

export type DetectionResult = {
  recognitionId: number;
  detectionId: number;
  type: 'periodic' | 'final';
  recordedDurationMs: number;
  windowStartMs: number;
  windowEndMs: number;
  processingDurationMs: number;
  notes: DetectionNote[];
};

export type RecognitionOptions = {
  detectionIntervalMs?: number;
  rollingWindowMs?: number;
};

export type RecognitionStartResult = {
  recognitionId: number;
};

export type BasicPitchModuleEvents = {
  onDetectionFinish: (event: DetectionResult) => void;
};

export type BasicPitchErrorCode =
  | 'ERR_MODEL_RESOURCE_MISSING'
  | 'ERR_MODEL_LOAD_FAILED'
  | 'ERR_MODEL_VALIDATION_FAILED'
  | 'ERR_AUDIO_CONVERSION_FAILED'
  | 'ERR_AUDIO_TOO_SHORT'
  | 'ERR_INFERENCE_FAILED'
  | 'ERR_MICROPHONE_PERMISSION_DENIED'
  | 'ERR_AUDIO_START_FAILED'
  | 'ERR_ALREADY_RECOGNIZING'
  | 'ERR_NOT_RECOGNIZING'
  | 'ERR_RECORDING_UNAVAILABLE'
  | 'ERR_SHARE_FAILED'
  | 'ERR_UNSUPPORTED_PLATFORM';
