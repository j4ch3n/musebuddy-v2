import ExpoModulesCore
import Foundation

public final class SoundFontPlayerModule: Module {
  private let player = SoundFontPlayerService()

  public func definition() -> ModuleDefinition {
    Name("SoundFontPlayer")
    Events("onCycleRepeat", "onDemoFinish", "onLeadInFinish", "onStep", "onTick")

    OnCreate {
      self.player.onCycleRepeat = { [weak self] payload in
        DispatchQueue.main.async {
          self?.sendEvent("onCycleRepeat", payload)
        }
      }
      self.player.onDemoFinish = { [weak self] payload in
        DispatchQueue.main.async {
          self?.sendEvent("onDemoFinish", payload)
        }
      }
      self.player.onLeadInFinish = { [weak self] payload in
        DispatchQueue.main.async {
          self?.sendEvent("onLeadInFinish", payload)
        }
      }
      self.player.onStep = { [weak self] payload in
        DispatchQueue.main.async {
          self?.sendEvent("onStep", payload)
        }
      }
      self.player.onTick = { [weak self] payload in
        DispatchQueue.main.async {
          self?.sendEvent("onTick", payload)
        }
      }
    }

    OnDestroy {
      self.player.onCycleRepeat = nil
      self.player.onDemoFinish = nil
      self.player.onLeadInFinish = nil
      self.player.onStep = nil
      self.player.onTick = nil
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

    AsyncFunction("playBand") { (configuration: SoundFontPlaybackConfigurationRecord) async throws in
      do {
        try await self.player.playBand(configuration: configuration)
      } catch let error as SoundFontPlayerError {
        throw SoundFontPlayerException(error)
      }
    }

    AsyncFunction("playGroove") { (configuration: SoundFontPlaybackConfigurationRecord) async throws in
      do {
        try await self.player.playGroove(configuration: configuration)
      } catch let error as SoundFontPlayerError {
        throw SoundFontPlayerException(error)
      }
    }

    AsyncFunction("stop") { () async in
      await self.player.stopAsync()
    }
  }
}
