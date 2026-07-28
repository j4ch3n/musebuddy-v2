import ExpoModulesCore

enum SoundFontPlayerError: Error {
  case emptyConfiguration
  case engineStartFailed(String)
  case invalidConfiguration(String)
  case loadFailed(String)
  case resourceMissing

  var code: String {
    switch self {
    case .emptyConfiguration:
      "ERR_SOUNDFONT_EMPTY_CONFIGURATION"
    case .engineStartFailed:
      "ERR_SOUNDFONT_ENGINE_START_FAILED"
    case .invalidConfiguration:
      "ERR_SOUNDFONT_INVALID_CONFIGURATION"
    case .loadFailed:
      "ERR_SOUNDFONT_LOAD_FAILED"
    case .resourceMissing:
      "ERR_SOUNDFONT_RESOURCE_MISSING"
    }
  }

  var message: String {
    switch self {
    case .emptyConfiguration:
      "The SoundFont playback configuration does not contain any playable parts."
    case let .engineStartFailed(detail):
      "The SoundFont player could not start audio playback: \(detail)"
    case let .invalidConfiguration(detail):
      "The SoundFont playback configuration is invalid: \(detail)"
    case let .loadFailed(detail):
      "The SoundFont could not be loaded: \(detail)"
    case .resourceMissing:
      "A bundled SoundFont could not be found."
    }
  }
}

final class SoundFontPlayerException: Exception, @unchecked Sendable {
  private let error: SoundFontPlayerError

  init(_ error: SoundFontPlayerError) {
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

struct SoundFontPlaybackCellRecord: Record {
  @Field var midi: Int?
  @Field var velocity: Int?
}

struct SoundFontPlaybackConfigurationRecord: Record {
  @Field var bpm: Double = 100
  @Field var tracks: SoundFontPlaybackTracksRecord = .init()
}

struct SoundFontPlaybackTracksRecord: Record {
  @Field var treble: [[[SoundFontPlaybackCellRecord]]] = []
  @Field var bass: [[[SoundFontPlaybackCellRecord]]]?
}

struct SoundFontPlaybackOptionsRecord: Record {
  @Field var keepAudioSessionActive: Bool = false
  @Field var leadIn: Bool = false
  @Field var repetitions: Int = 1
}
