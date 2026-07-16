import ExpoModulesCore

enum BasicPitchError: Error {
  case modelResourceMissing
  case modelLoadFailed(String)
  case modelValidationFailed(String)
  case audioConversionFailed(String)
  case audioTooShort
  case inferenceFailed(String)
  case microphonePermissionDenied
  case audioStartFailed(String)
  case alreadyRecognizing
  case notRecognizing
  case recordingUnavailable(String)
  case shareFailed(String)

  var code: String {
    switch self {
    case .modelResourceMissing:
      "ERR_MODEL_RESOURCE_MISSING"
    case .modelLoadFailed:
      "ERR_MODEL_LOAD_FAILED"
    case .modelValidationFailed:
      "ERR_MODEL_VALIDATION_FAILED"
    case .audioConversionFailed:
      "ERR_AUDIO_CONVERSION_FAILED"
    case .audioTooShort:
      "ERR_AUDIO_TOO_SHORT"
    case .inferenceFailed:
      "ERR_INFERENCE_FAILED"
    case .microphonePermissionDenied:
      "ERR_MICROPHONE_PERMISSION_DENIED"
    case .audioStartFailed:
      "ERR_AUDIO_START_FAILED"
    case .alreadyRecognizing:
      "ERR_ALREADY_RECOGNIZING"
    case .notRecognizing:
      "ERR_NOT_RECOGNIZING"
    case .recordingUnavailable:
      "ERR_RECORDING_UNAVAILABLE"
    case .shareFailed:
      "ERR_SHARE_FAILED"
    }
  }

  var message: String {
    switch self {
    case .modelResourceMissing:
      "The bundled Basic Pitch model could not be found."
    case let .modelLoadFailed(detail):
      "The Basic Pitch model could not be loaded: \(detail)"
    case let .modelValidationFailed(detail):
      "The Basic Pitch model has an unexpected interface: \(detail)"
    case let .audioConversionFailed(detail):
      "Audio conversion failed: \(detail)"
    case .audioTooShort:
      "The recording must contain at least one Basic Pitch window."
    case let .inferenceFailed(detail):
      "Basic Pitch inference failed: \(detail)"
    case .microphonePermissionDenied:
      "Microphone access is required for Basic Pitch recognition."
    case let .audioStartFailed(detail):
      "Basic Pitch audio input could not start: \(detail)"
    case .alreadyRecognizing:
      "Basic Pitch recognition is already running."
    case .notRecognizing:
      "Basic Pitch recognition is not running."
    case let .recordingUnavailable(detail):
      "The Basic Pitch recording is unavailable: \(detail)"
    case let .shareFailed(detail):
      "The Basic Pitch recording could not be shared: \(detail)"
    }
  }
}

final class BasicPitchException: Exception, @unchecked Sendable {
  private let error: BasicPitchError

  init(_ error: BasicPitchError) {
    self.error = error
    super.init()
  }

  override var reason: String {
    error.message
  }

  override var code: String {
    error.code
  }
}

struct DetectionNoteRecord: Record {
  @Field var id: Int = 0
  @Field var midiPitch: Int = 0
  @Field var startTimeMs: Double = 0
  @Field var endTimeMs: Double = 0
  @Field var durationMs: Double = 0
  @Field var confidence: Double = 0
  @Field var velocity: Int = 0
}

struct DetectionResultRecord: Record {
  @Field var recognitionId: Int = 0
  @Field var detectionId: Int = 0
  @Field var type: String = ""
  @Field var recordedDurationMs: Double = 0
  @Field var windowStartMs: Double = 0
  @Field var windowEndMs: Double = 0
  @Field var processingDurationMs: Double = 0
  @Field var notes: [DetectionNoteRecord] = []
}

struct DecodedNote {
  let startFrame: Int
  let endFrame: Int
  let midiPitch: Int
  let confidence: Float
}

struct TimedNote {
  let midiPitch: Int
  let startTimeMs: Double
  let endTimeMs: Double
  let confidence: Float

  var durationMs: Double {
    endTimeMs - startTimeMs
  }

  var velocity: Int {
    min(127, max(0, Int((confidence * 127).rounded())))
  }
}

struct ModelOutputs {
  let frameCount: Int
  let notes: [Float]
  let onsets: [Float]
}
