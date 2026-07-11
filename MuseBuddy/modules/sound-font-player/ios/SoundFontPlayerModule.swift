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
      self.player.stop()
    }

    Function("isPlaying") { () -> Bool in
      self.player.isPlaying
    }

    AsyncFunction("prepareSoundFonts") { () async throws in
      do {
        try await self.player.prepareSoundFonts()
      } catch let error as SoundFontPlayerError {
        throw SoundFontPlayerException(error)
      }
    }

    AsyncFunction("playBand") { (configuration: PlaybackConfig, options: PlaybackOptions) async throws in
      do {
        let playbackId = try await self.player.playBand(configuration: configuration, options: options)
        return ["playbackId": playbackId]
      } catch let error as SoundFontPlayerError {
        throw SoundFontPlayerException(error)
      }
    }

    AsyncFunction("playGroove") { (configuration: PlaybackConfig, options: PlaybackOptions) async throws in
      do {
        let playbackId = try await self.player.playGroove(configuration: configuration, options: options)
        return ["playbackId": playbackId]
      } catch let error as SoundFontPlayerError {
        throw SoundFontPlayerException(error)
      }
    }

    AsyncFunction("restartBand") { (configuration: PlaybackConfig, options: PlaybackOptions) async throws in
      do {
        let playbackId = try await self.player.restartBand(configuration: configuration, options: options)
        return ["playbackId": playbackId]
      } catch let error as SoundFontPlayerError {
        throw SoundFontPlayerException(error)
      }
    }

    AsyncFunction("restartGroove") { (configuration: PlaybackConfig, options: PlaybackOptions) async throws in
      do {
        let playbackId = try await self.player.restartGroove(configuration: configuration, options: options)
        return ["playbackId": playbackId]
      } catch let error as SoundFontPlayerError {
        throw SoundFontPlayerException(error)
      }
    }

    AsyncFunction("stop") { () async in
      await self.player.stopAsync()
    }
  }
}
