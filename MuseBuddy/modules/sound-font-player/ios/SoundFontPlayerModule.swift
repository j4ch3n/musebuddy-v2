import ExpoModulesCore
import Foundation

public final class SoundFontPlayerModule: Module {
  private let player = SoundFontPlayerService()

  public func definition() -> ModuleDefinition {
    Name("SoundFontPlayer")
    Events("onLeadInFinish", "onStep", "onTick")

    OnCreate {
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
      self.player.onLeadInFinish = nil
      self.player.onStep = nil
      self.player.onTick = nil
      self.player.stop()
    }

    Function("isPlaying") { () -> Bool in
      self.player.isPlaying
    }

    AsyncFunction("play") { (configuration: SoundFontPlaybackConfigurationRecord) async throws in
      do {
        try await self.player.play(configuration: configuration)
      } catch let error as SoundFontPlayerError {
        throw SoundFontPlayerException(error)
      }
    }

    AsyncFunction("stop") { () async in
      await self.player.stopAsync()
    }
  }
}
