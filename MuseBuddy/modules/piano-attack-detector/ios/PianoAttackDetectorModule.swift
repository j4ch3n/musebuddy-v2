import AVFoundation
import Darwin
import ExpoModulesCore
import Foundation
import UIKit

public final class PianoAttackDetectorModule: Module {
  private let detector = PianoAttackDetectorService()

  public func definition() -> ModuleDefinition {
    Name("PianoAttackDetector")
    Events("onAttack", "onRelease", "onAmbientLevelChange")
    OnCreate {
      self.detector.onAttack = { [weak self] in self?.sendEvent("onAttack", $0) }
      self.detector.onAmbientLevelChange = { [weak self] in self?.sendEvent("onAmbientLevelChange", $0) }
    }
    OnDestroy { self.detector.stopListening() }
    Function("isListening") { self.detector.isListening }
    AsyncFunction("startListening") { (options: [String: Double]) async throws in
      try await self.detector.startListening(options: options)
    }
    AsyncFunction("stopListening") { () async throws in try await self.detector.stopListeningAsync() }
    AsyncFunction("getArtifactFiles") { () async -> [String: String] in self.detector.artifactFiles() }
    AsyncFunction("shareArtifact") { (kind: String) async throws in try await self.detector.shareArtifact(kind: kind) }
  }
}

private enum PianoAttackDetectorError: LocalizedError {
  case permissionDenied, alreadyListening, notListening, audioStart(String), artifactUnavailable(String)

  var errorDescription: String? {
    switch self {
    case .permissionDenied: "Microphone permission was denied."
    case .alreadyListening: "The piano attack detector is already listening."
    case .notListening: "The piano attack detector is not listening."
    case let .audioStart(detail): "The piano attack detector could not start audio input: \(detail)"
    case let .artifactUnavailable(detail): detail
    }
  }
}

private final class PianoAttackDetectorService: @unchecked Sendable {
  private struct CaptureSegment { let startedAtMs: Double
    let sampleIndex: Int64
  }

  private let engine = AVAudioEngine()
  private let queue = DispatchQueue(label: "com.musebuddy.piano-attack-detector")
  private var detector: SpectralFluxDetector?
  private var listening = false
  private var sampleRate = 44_100.0
  private var capturedSamples: Int64 = 0
  private var hostEpochOffsetMs = 0.0
  private var captureSegments: [CaptureSegment] = []
  private var nextEventId = 0
  private var lastAmbientDb: Int?

  var onAttack: (([String: Any]) -> Void)?
  var onAmbientLevelChange: (([String: Any]) -> Void)?

  private var artifactDirectory: URL {
    FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("PianoAttackDetector", isDirectory: true)
  }

  private var audioURL: URL {
    artifactDirectory.appendingPathComponent("piano-attack-recording.wav")
  }

  private var logURL: URL {
    artifactDirectory.appendingPathComponent("piano-attack-events.jsonl")
  }

  var isListening: Bool {
    queue.sync { listening }
  }

  func startListening(options: [String: Double]) async throws {
    guard await requestPermission() else { throw PianoAttackDetectorError.permissionDenied }
    try await onQueue { try self.start(options: options) }
  }

  func stopListeningAsync() async throws {
    try await onQueue {
      guard self.listening else { throw PianoAttackDetectorError.notListening }
      self.stop()
    }
  }

  func stopListening() {
    queue.sync { if listening { stop() } }
  }

  func artifactFiles() -> [String: String] {
    ["audioUri": audioURL.absoluteString, "logUri": logURL.absoluteString]
  }

  func shareArtifact(kind: String) async throws {
    let url = kind == "audio" ? audioURL : kind == "log" ? logURL : nil
    guard let url, FileManager.default.fileExists(atPath: url.path) else {
      throw PianoAttackDetectorError.artifactUnavailable("No \(kind) artifact has been written yet.")
    }
    try await MainActor.run {
      guard let presenter = UIApplication.shared.connectedScenes
        .compactMap({ ($0 as? UIWindowScene)?.keyWindow?.rootViewController }).first
      else { throw PianoAttackDetectorError.artifactUnavailable("No active view controller is available.") }
      presenter.present(UIActivityViewController(activityItems: [url], applicationActivities: nil), animated: true)
    }
  }

  private func start(options: [String: Double]) throws {
    guard !listening else { throw PianoAttackDetectorError.alreadyListening }
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .allowBluetoothHFP, .mixWithOthers])
      try session.setActive(true)
    } catch { throw PianoAttackDetectorError.audioStart(error.localizedDescription) }
    let input = engine.inputNode
    let format = input.outputFormat(forBus: 0)
    guard format.sampleRate > 0, format.channelCount > 0 else { throw PianoAttackDetectorError.audioStart("The microphone returned an invalid format.") }
    sampleRate = format.sampleRate
    let configuration = SpectralFluxConfiguration(options: options)
    guard let spectralFluxDetector = SpectralFluxDetector(sampleRate: sampleRate, configuration: configuration) else {
      throw PianoAttackDetectorError.audioStart("The microphone format cannot be analyzed with the spectral-flux configuration.")
    }
    detector = spectralFluxDetector
    capturedSamples = 0
    captureSegments.removeAll()
    nextEventId = 0
    lastAmbientDb = nil
    try prepareArtifacts()
    input.removeTap(onBus: 0)
    input.installTap(onBus: 0, bufferSize: 1_024, format: format) { [weak self] buffer, time in
      guard let self, let samples = buffer.monoSamples() else { return }
      process(samples: samples, startedAtMs: captureTime(time, buffer: buffer))
    }
    do {
      engine.prepare()
      hostEpochOffsetMs = Date().timeIntervalSince1970 * 1_000 - AVAudioTime.seconds(forHostTime: mach_absolute_time()) * 1_000
      try engine.start()
      listening = true
    } catch {
      input.removeTap(onBus: 0)
      detector = nil
      throw PianoAttackDetectorError.audioStart(error.localizedDescription)
    }
  }

  private func stop() {
    engine.stop()
    engine.inputNode.removeTap(onBus: 0)
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    if let detector {
      for event in detector.finish() {
        emit(event)
      }
    }
    listening = false
    detector = nil
  }

  private func process(samples: [Float], startedAtMs: Double) {
    queue.async {
      guard self.listening, let detector = self.detector else { return }
      self.captureSegments.append(CaptureSegment(startedAtMs: startedAtMs, sampleIndex: self.capturedSamples))
      self.capturedSamples += Int64(samples.count)
      for event in detector.process(samples: samples) {
        self.emit(event)
      }
    }
  }

  private func emit(_ event: OnsetEvent) {
    nextEventId += 1
    let timeMs = event.timestampSeconds * 1_000
    let payload: [String: Any] = [
      "absoluteTimeMs": absoluteTime(for: event.sampleIndex), "id": nextEventId, "type": "attack",
      "timestampMs": timeMs, "timeMs": timeMs, "emittedAtMs": Double(capturedSamples) / sampleRate * 1_000,
      "levelDb": 0.0, "dB": 0.0, "ambientDb": -120.0, "noiseDb": -120.0,
      "deltaDb": event.prominence, "onsetStrengthDb": event.spectralFlux, "score": event.spectralFlux,
      "threshold": event.adaptiveThreshold, "spectralFlux": event.spectralFlux, "prominence": event.prominence,
      "confidence": event.confidence,
      "frameRmsDbfs": event.frameRmsDbfs,
    ]
    appendLog(payload)
    DispatchQueue.main.async { [weak self] in self?.onAttack?(payload) }
  }

  private func absoluteTime(for sampleIndex: Int64) -> Double {
    guard let segment = captureSegments.last(where: { $0.sampleIndex <= sampleIndex }) else { return Date().timeIntervalSince1970 * 1_000 }
    return segment.startedAtMs + Double(sampleIndex - segment.sampleIndex) / sampleRate * 1_000
  }

  private func captureTime(_ time: AVAudioTime, buffer: AVAudioPCMBuffer) -> Double {
    if time.isHostTimeValid { return hostEpochOffsetMs + AVAudioTime.seconds(forHostTime: time.hostTime) * 1_000 }
    return Date().timeIntervalSince1970 * 1_000 - Double(buffer.frameLength) / sampleRate * 1_000
  }

  private func prepareArtifacts() throws {
    try FileManager.default.createDirectory(at: artifactDirectory, withIntermediateDirectories: true)
    FileManager.default.createFile(atPath: logURL.path, contents: nil)
  }

  private func appendLog(_ payload: [String: Any]) {
    guard let data = try? JSONSerialization.data(withJSONObject: payload), let handle = try? FileHandle(forWritingTo: logURL) else { return }
    handle.seekToEndOfFile()
    handle.write(data)
    handle.write(Data("\n".utf8))
    try? handle.close()
  }

  private func requestPermission() async -> Bool {
    let session = AVAudioSession.sharedInstance()
    if session.recordPermission == .granted { return true }
    guard session.recordPermission == .undetermined else { return false }
    return await withCheckedContinuation { continuation in session.requestRecordPermission { continuation.resume(returning: $0) } }
  }

  private func onQueue(_ work: @escaping () throws -> Void) async throws {
    try await withCheckedThrowingContinuation { continuation in queue.async { do { try work()
      continuation.resume()
    } catch { continuation.resume(throwing: error) } } }
  }
}

private extension AVAudioPCMBuffer {
  func monoSamples() -> [Float]? {
    guard let channels = floatChannelData else { return nil }
    let frames = Int(frameLength)
    let count = Int(format.channelCount)
    var mono = [Float](repeating: 0, count: frames)
    for frame in 0 ..< frames {
      var sum: Float = 0
      for channel in 0 ..< count {
        sum += channels[channel][frame]
      }
      mono[frame] = sum / Float(count)
    }
    return mono
  }
}
