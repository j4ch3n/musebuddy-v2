import ExpoModulesCore
import Foundation

public final class BasicPitchModule: Module {
  private let service = BasicPitchService()

  public func definition() -> ModuleDefinition {
    Name("BasicPitch")
    Events("onDetectionFinish")

    OnCreate {
      self.service.onDetectionFinish = { [weak self] payload in
        self?.sendEvent("onDetectionFinish", payload)
      }
    }

    OnDestroy {
      self.service.onDetectionFinish = nil
      self.service.cancelRecognition()
    }

    AsyncFunction("initialize") { () async throws in
      do {
        try await self.service.initialize()
      } catch let error as BasicPitchError {
        throw BasicPitchException(error)
      }
    }

    AsyncFunction("startRecognition") { (options: [String: Double]) async throws in
      do {
        try await self.service.startRecognition(options: options)
      } catch let error as BasicPitchError {
        throw BasicPitchException(error)
      }
    }

    AsyncFunction("stopRecognition") { () async throws -> DetectionResultRecord in
      do {
        return try await self.service.stopRecognition()
      } catch let error as BasicPitchError {
        throw BasicPitchException(error)
      }
    }

    AsyncFunction("shareRecording") { () async throws in
      do {
        try await self.service.shareRecording()
      } catch let error as BasicPitchError {
        throw BasicPitchException(error)
      }
    }

    Function("isRecognizing") { () -> Bool in
      self.service.isRecognizing
    }
  }
}
