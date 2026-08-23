export type PianoAttackDetectorModuleEvents = {
  onAmbientLevelChange: (event: PianoAmbientLevelChangeEvent) => void;
  onAttack: (event: PianoAttackEvent) => void;
  onRelease: (event: PianoAttackEvent) => void;
};

export type PianoAttackDetectorArtifactKind = 'audio' | 'log';

export type PianoAttackDetectorArtifactFiles = {
  audioUri: string;
  logUri: string;
};

export type PianoAttackDetectorConfiguration = {
  /** Reference analysis rate used to scale frame durations to the input format. */
  fftSize: number;
  hopSize: number;
  highPassCutoffHz: number;
  minimumFrequency: number;
  maximumFrequency: number;
  magnitudeCompression: number;
  thresholdHistorySeconds: number;
  thresholdMultiplier: number;
  minimumFlux: number;
  minimumProminence: number;
  minimumThresholdRatio: number;
  minimumRmsRiseDb: number;
  cooldownMs: number;
  useSquaredFlux: number;
  normalizeSpectrum: number;
};

export type PianoAmbientLevelChangeEvent = {
  levelDb: number;
  roundedLevelDb: number;
  timestampMs: number;
};

export type PianoAttackEvent = {
  /** Absolute epoch time of the captured onset, derived from the audio input clock. */
  absoluteTimeMs: number;
  id: number;
  type: 'attack' | 'release';
  timestampMs: number;
  timeMs: number;
  emittedAtMs: number;
  levelDb: number;
  dB: number;
  ambientDb: number;
  noiseDb: number;
  deltaDb: number;
  onsetStrengthDb: number;
  score: number;
  threshold: number;
  spectralFlux: number;
  prominence: number;
  confidence: number;
  frameRmsDbfs: number;
};

export type PianoAttackDetectorErrorCode =
  | 'ERR_ATTACK_DETECTOR_ALREADY_LISTENING'
  | 'ERR_ATTACK_DETECTOR_ARTIFACT_UNAVAILABLE'
  | 'ERR_ATTACK_DETECTOR_AUDIO_START_FAILED'
  | 'ERR_ATTACK_DETECTOR_NOT_LISTENING'
  | 'ERR_ATTACK_DETECTOR_SHARE_FAILED'
  | 'ERR_MICROPHONE_PERMISSION_DENIED'
  | 'ERR_UNSUPPORTED_PLATFORM';
