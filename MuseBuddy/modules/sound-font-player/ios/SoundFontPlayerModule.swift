import ExpoModulesCore

public final class SoundFontPlayerModule: Module {
  private let player = SoundFontPlayerService()

  public func definition() -> ModuleDefinition {
    Name("SoundFontPlayer")

    OnDestroy {
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
