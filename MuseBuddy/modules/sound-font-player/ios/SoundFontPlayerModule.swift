import ExpoModulesCore
import Foundation

private typealias PlaybackConfig = SoundFontPlaybackConfigurationRecord
private typealias PlaybackOptions = SoundFontPlaybackOptionsRecord

public final class SoundFontPlayerModule: Module {
  private let player = SoundFontPlayerService()

  public func definition() -> ModuleDefinition {
    Name("SoundFontPlayer")
    Events("onPlaybackFinish")

    OnCreate {
      self.player.onPlaybackFinish = { [weak self] payload in
        DispatchQueue.main.async {
          self?.sendEvent("onPlaybackFinish", payload)
        }
      }
    }

    OnDestroy {
      self.player.onPlaybackFinish = nil
      self.player.dispose()
    }

    AsyncFunction("playPiano") { (configuration: PlaybackConfig, options: PlaybackOptions) async throws in
      do {
        let result = try await self.player.playPiano(
          configuration: configuration,
          options: options
        )
        return ["playbackId": result.playbackId, "startedAtMs": result.startedAtMs]
      } catch let error as SoundFontPlayerError {
        throw SoundFontPlayerException(error)
      }
    }

    AsyncFunction("playGroove") { (configuration: PlaybackConfig, options: PlaybackOptions) async throws in
      do {
        let result = try await self.player.playGroove(
          configuration: configuration,
          options: options
        )
        return ["playbackId": result.playbackId, "startedAtMs": result.startedAtMs]
      } catch let error as SoundFontPlayerError {
        throw SoundFontPlayerException(error)
      }
    }

    AsyncFunction("stop") { (playbackId: Int) async in
      await self.player.stop(playbackId: playbackId)
    }
  }
}
