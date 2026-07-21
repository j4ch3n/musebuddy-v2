import AVFoundation
import CoreML
import Foundation
import UIKit

// swiftlint:disable file_length type_body_length
final class BasicPitchService: @unchecked Sendable {
  private static let sampleRate = 22_050
  private static let fftHop = 256
  private static let modelSampleCount = 43_844
  private static let defaultDetectionIntervalMs = 500.0
  private static let defaultRollingWindowMs = 2_900.0
  private static let maximumAnalysisIntervalMs = 500.0
  private static let commitDelayMs = 1_000.0
  private static let minimumWindowRMS: Float = 0.0015
  private static let minimumWindowPeak: Float = 0.02
  private static let minimumNoteConfidence: Float = 0.5
  private static let finalOverlapFrameCount = 30
  private static let finalOverlapSampleCount = finalOverlapFrameCount * fftHop
  private static let finalHopSampleCount = modelSampleCount - finalOverlapSampleCount

  private let audioEngine = AVAudioEngine()
  private let workQueue = DispatchQueue(
    label: "com.musebuddy.basic-pitch",
    qos: .userInitiated
  )

  private var model: MLModel?
  private var recognizing = false
  private var detectionInFlight = false
  private var detectionTimer: DispatchSourceTimer?
  private var detectionId = 0
  private var recognitionId = 0
  private var activeRecognitionId: Int?
  private var recordedSamples: [Float] = []
  private var rollingWindowSampleCount = modelSampleCount
  private var analysisIntervalSampleCount = 1
  private var nextAnalysisEndSample = 0
  private var lastCommittedTimeMs = 0.0
  private var committedNotes: [TimedNote] = []
  private var recordingConverter: AVAudioConverter?
  private var modelAudioFormat: AVAudioFormat?
  private var recordingFileURL: URL {
    artifactDirectoryURL.appendingPathComponent("basic-pitch-recording.wav")
  }

  private var artifactDirectoryURL: URL {
    FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("BasicPitch", isDirectory: true)
  }

  var onDetectionFinish: (([String: Any]) -> Void)?

  var isRecognizing: Bool {
    workQueue.sync {
      recognizing
    }
  }

  func initialize() async throws {
    try await perform {
      if self.model != nil {
        return
      }

      guard let modelURL = self.findModelURL() else {
        throw BasicPitchError.modelResourceMissing
      }

      do {
        let configuration = MLModelConfiguration()
        configuration.computeUnits = .all
        let loadedModel = try MLModel(contentsOf: modelURL, configuration: configuration)
        try self.validate(model: loadedModel)
        self.model = loadedModel
      } catch let error as BasicPitchError {
        throw error
      } catch {
        throw BasicPitchError.modelLoadFailed(error.localizedDescription)
      }
    }
  }

  func startRecognition(options: [String: Double]) async throws -> Int {
    try await initialize()

    guard await requestMicrophonePermission() else {
      throw BasicPitchError.microphonePermissionDenied
    }

    return try await perform {
      try self.startRecognitionOnQueue(options: options)
    }
  }

  func stopRecognition(recognitionId: Int) async throws -> DetectionResultRecord {
    try await perform {
      guard self.recognizing, self.activeRecognitionId == recognitionId else {
        throw BasicPitchError.notRecognizing
      }

      self.stopRecordingOnQueue()
      guard self.recordedSamples.count >= Self.modelSampleCount else {
        self.recordedSamples.removeAll(keepingCapacity: true)
        self.activeRecognitionId = nil
        throw BasicPitchError.audioTooShort
      }

      let result = try self.detectRolling(
        type: "final",
        samples: self.recordedSamples,
        recordedSampleCount: self.recordedSamples.count,
        isFinal: true
      )
      try self.writeRecordingFile(samples: self.recordedSamples)
      self.recordedSamples.removeAll(keepingCapacity: true)
      self.committedNotes.removeAll(keepingCapacity: true)
      self.activeRecognitionId = nil
      self.emit(result)
      return result
    }
  }

  func shareRecording() async throws {
    let fileURL = try workQueue.sync {
      guard FileManager.default.fileExists(atPath: self.recordingFileURL.path) else {
        throw BasicPitchError.recordingUnavailable("No completed recording has been written yet.")
      }
      return self.recordingFileURL
    }

    try await MainActor.run {
      guard let presenter = Self.topViewController() else {
        throw BasicPitchError.shareFailed("No active view controller is available.")
      }

      let activity = UIActivityViewController(activityItems: [fileURL], applicationActivities: nil)
      if let popover = activity.popoverPresentationController {
        popover.sourceView = presenter.view
        popover.sourceRect = CGRect(
          x: presenter.view.bounds.midX,
          y: presenter.view.bounds.midY,
          width: 1,
          height: 1
        )
      }
      presenter.present(activity, animated: true)
    }
  }

  func cancelAnyRecognition() {
    workQueue.async {
      guard self.recognizing else {
        return
      }
      self.stopRecordingOnQueue()
      self.recordedSamples.removeAll(keepingCapacity: true)
      self.committedNotes.removeAll(keepingCapacity: true)
      self.activeRecognitionId = nil
    }
  }

  func cancelRecognition(recognitionId: Int) async {
    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      workQueue.async {
        defer { continuation.resume() }
        guard self.recognizing, self.activeRecognitionId == recognitionId else {
          return
        }
        self.stopRecordingOnQueue()
        self.recordedSamples.removeAll(keepingCapacity: true)
        self.committedNotes.removeAll(keepingCapacity: true)
        self.activeRecognitionId = nil
      }
    }
  }

  private func startRecognitionOnQueue(options: [String: Double]) throws -> Int {
    guard !recognizing else {
      throw BasicPitchError.alreadyRecognizing
    }
    guard model != nil else {
      throw BasicPitchError.modelLoadFailed("The model has not been initialized.")
    }

    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(
        .playAndRecord,
        mode: .measurement,
        options: [.defaultToSpeaker, .allowBluetoothHFP, .mixWithOthers]
      )
      try session.setActive(true)
    } catch {
      throw BasicPitchError.audioStartFailed(error.localizedDescription)
    }

    let inputNode = audioEngine.inputNode
    let inputFormat = inputNode.outputFormat(forBus: 0)
    guard inputFormat.sampleRate > 0, inputFormat.channelCount > 0 else {
      throw BasicPitchError.audioStartFailed("The microphone returned an invalid format.")
    }
    guard let modelFormat = Self.makeModelAudioFormat() else {
      throw BasicPitchError.audioStartFailed("Could not create the model audio format.")
    }
    guard let converter = AVAudioConverter(from: inputFormat, to: modelFormat) else {
      throw BasicPitchError.audioStartFailed("Could not create the audio converter.")
    }

    try prepareRecordingArtifact()
    recordingConverter = converter
    modelAudioFormat = modelFormat
    recordedSamples.removeAll(keepingCapacity: true)
    detectionId = 0
    detectionInFlight = false
    let detectionIntervalMs = options["detectionIntervalMs"] ?? Self.defaultDetectionIntervalMs
    let rollingWindowMs = options["rollingWindowMs"] ?? Self.defaultRollingWindowMs
    rollingWindowSampleCount = max(
      Self.modelSampleCount,
      Self.sampleCount(forMilliseconds: rollingWindowMs)
    )
    analysisIntervalSampleCount = max(
      1,
      Self.sampleCount(forMilliseconds: min(detectionIntervalMs, Self.maximumAnalysisIntervalMs))
    )
    nextAnalysisEndSample = rollingWindowSampleCount
    lastCommittedTimeMs = 0
    committedNotes.removeAll(keepingCapacity: true)
    recognizing = true
    recognitionId += 1
    activeRecognitionId = recognitionId

    inputNode.removeTap(onBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1_024, format: inputFormat) { [weak self] buffer, _ in
      guard let copiedBuffer = Self.copy(buffer: buffer) else {
        return
      }
      self?.append(buffer: copiedBuffer)
    }

    do {
      audioEngine.prepare()
      try audioEngine.start()
      startDetectionTimer(intervalMs: detectionIntervalMs)
      return recognitionId
    } catch {
      inputNode.removeTap(onBus: 0)
      recordingConverter = nil
      modelAudioFormat = nil
      recognizing = false
      activeRecognitionId = nil
      try? session.setActive(false, options: .notifyOthersOnDeactivation)
      throw BasicPitchError.audioStartFailed(error.localizedDescription)
    }
  }

  private func stopRecordingOnQueue() {
    detectionTimer?.cancel()
    detectionTimer = nil

    if audioEngine.isRunning {
      audioEngine.stop()
    }
    audioEngine.inputNode.removeTap(onBus: 0)
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)

    recognizing = false
    detectionInFlight = false
    recordingConverter = nil
    modelAudioFormat = nil
  }

  private func startDetectionTimer(intervalMs: Double) {
    let interval = max(100, intervalMs) / 1_000
    let timer = DispatchSource.makeTimerSource(queue: workQueue)
    timer.schedule(deadline: .now() + interval, repeating: interval)
    timer.setEventHandler { [weak self] in
      self?.runPeriodicDetectionIfReady()
    }
    detectionTimer = timer
    timer.resume()
  }

  private func append(buffer: AVAudioPCMBuffer) {
    workQueue.async {
      guard self.recognizing else {
        return
      }

      do {
        try self.recordedSamples.append(contentsOf: self.convertToModelSamples(buffer: buffer))
      } catch {
        // The next explicit stop/start call will surface state. Dropping a malformed tap buffer is safer
        // than stopping recognition from the audio render callback path.
        return
      }
    }
  }

  private func runPeriodicDetectionIfReady() {
    guard recognizing,
          !detectionInFlight,
          recordedSamples.count >= nextAnalysisEndSample
    else {
      return
    }

    detectionInFlight = true
    let recordedSampleCount = recordedSamples.count
    let samples = recordedSamples

    do {
      let result = try detectRolling(
        type: "periodic",
        samples: samples,
        recordedSampleCount: recordedSampleCount,
        isFinal: false
      )
      detectionInFlight = false
      emit(result)
    } catch {
      detectionInFlight = false
    }
  }

  private func detectRolling(
    type: String,
    samples: [Float],
    recordedSampleCount: Int,
    isFinal: Bool
  ) throws -> DetectionResultRecord {
    guard samples.count >= Self.modelSampleCount else {
      throw BasicPitchError.audioTooShort
    }

    let processingStartedAt = Date()
    let recordedDurationMs = milliseconds(forSampleCount: recordedSampleCount)
    let endSamples = rollingAnalysisEndSamples(sampleCount: samples.count, isFinal: isFinal)
    var detectionWindowStartSample = max(0, recordedSampleCount - rollingWindowSampleCount)

    for endSample in endSamples {
      let startSample = max(0, endSample - rollingWindowSampleCount)
      detectionWindowStartSample = min(detectionWindowStartSample, startSample)
      let windowNotes = try detectWindow(
        samples: Array(samples[startSample ..< endSample]),
        absoluteStartSample: startSample,
        absoluteEndSample: endSample,
        recordedDurationMs: recordedDurationMs
      )
      let analysisEndMs = milliseconds(forSampleCount: endSample)
      let commitThroughMs = isFinal && endSample == endSamples.last
        ? recordedDurationMs
        : max(0, analysisEndMs - Self.commitDelayMs)

      if commitThroughMs > lastCommittedTimeMs {
        committedNotes.append(contentsOf: windowNotes.filter { note in
          note.startTimeMs >= lastCommittedTimeMs && note.startTimeMs < commitThroughMs
        })
        lastCommittedTimeMs = commitThroughMs
      }

      nextAnalysisEndSample = max(nextAnalysisEndSample, endSample + analysisIntervalSampleCount)
    }

    detectionId += 1
    let result = DetectionResultRecord()
    result.recognitionId = activeRecognitionId ?? 0
    result.detectionId = detectionId
    result.type = type
    result.recordedDurationMs = recordedDurationMs
    result.windowStartMs = milliseconds(forSampleCount: detectionWindowStartSample)
    result.windowEndMs = recordedDurationMs
    result.processingDurationMs = Date().timeIntervalSince(processingStartedAt) * 1_000
    result.notes = makeNoteRecords(notes: merge(notes: committedNotes))
    return result
  }

  private func rollingAnalysisEndSamples(sampleCount: Int, isFinal: Bool) -> [Int] {
    var endSamples: [Int] = []
    var candidateEndSample = nextAnalysisEndSample
    while candidateEndSample <= sampleCount {
      endSamples.append(candidateEndSample)
      if candidateEndSample == sampleCount {
        break
      }
      candidateEndSample += analysisIntervalSampleCount
    }

    if isFinal,
       sampleCount >= Self.modelSampleCount,
       endSamples.last != sampleCount {
      endSamples.append(sampleCount)
    }

    return endSamples
  }

  private func detectWindow(
    samples: [Float],
    absoluteStartSample: Int,
    absoluteEndSample: Int,
    recordedDurationMs: Double
  ) throws -> [TimedNote] {
    guard containsAudibleSignal(samples) else {
      return []
    }

    let output = try runStitchedInference(samples: samples)
    let absoluteWindowStartMs = milliseconds(forSampleCount: absoluteStartSample)
    let absoluteWindowEndMs = milliseconds(forSampleCount: absoluteEndSample)
    return BasicPitchDecoder.decode(output).compactMap { note in
      let startTimeMs = min(
        recordedDurationMs,
        absoluteWindowStartMs + BasicPitchDecoder.time(forFrame: note.startFrame) * 1_000
      )
      let endTimeMs = min(
        recordedDurationMs,
        absoluteWindowStartMs + BasicPitchDecoder.time(forFrame: note.endFrame) * 1_000
      )
      guard endTimeMs > startTimeMs,
            endTimeMs <= absoluteWindowEndMs,
            note.confidence >= Self.minimumNoteConfidence
      else {
        return nil
      }

      return TimedNote(
        midiPitch: note.midiPitch,
        startTimeMs: startTimeMs,
        endTimeMs: endTimeMs,
        confidence: note.confidence
      )
    }
  }

  private func runStitchedInference(samples: [Float]) throws -> ModelOutputs {
    guard !samples.isEmpty else {
      return ModelOutputs(frameCount: 0, notes: [], onsets: [])
    }

    let leadingPadding = Self.finalOverlapSampleCount / 2
    let overlapFramesPerSide = Self.finalOverlapFrameCount / 2
    let framesPerWindow = 172
    let retainedFramesPerWindow = framesPerWindow - (overlapFramesPerSide * 2)
    var paddedSamples = [Float](repeating: 0, count: leadingPadding)
    paddedSamples.append(contentsOf: samples)
    var noteWindows: [[Float]] = []
    var onsetWindows: [[Float]] = []
    var windowStart = 0

    while windowStart < paddedSamples.count {
      var inputSamples = [Float](repeating: 0, count: Self.modelSampleCount)
      for sampleIndex in 0 ..< Self.modelSampleCount {
        let sourceIndex = windowStart + sampleIndex
        inputSamples[sampleIndex] = sourceIndex < paddedSamples.count ? paddedSamples[sourceIndex] : 0
      }

      let output = try runInference(samples: inputSamples)
      noteWindows.append(extractFrames(
        output.notes,
        startFrame: overlapFramesPerSide,
        frameCount: retainedFramesPerWindow,
        pitchCount: 88
      ))
      onsetWindows.append(extractFrames(
        output.onsets,
        startFrame: overlapFramesPerSide,
        frameCount: retainedFramesPerWindow,
        pitchCount: 88
      ))
      windowStart += Self.finalHopSampleCount
    }

    let expectedFrameCount = Int(
      (Double(samples.count) / Double(Self.finalHopSampleCount)) * Double(retainedFramesPerWindow)
    )
    let availableFrameCount = noteWindows.count * retainedFramesPerWindow
    let frameCount = min(expectedFrameCount, availableFrameCount)
    let valueCount = frameCount * 88
    return ModelOutputs(
      frameCount: frameCount,
      notes: Array(noteWindows.joined().prefix(valueCount)),
      onsets: Array(onsetWindows.joined().prefix(valueCount))
    )
  }

  private func runInference(samples: [Float]) throws -> ModelOutputs {
    guard let model else {
      throw BasicPitchError.modelLoadFailed("The model has not been initialized.")
    }

    do {
      let input = try MLMultiArray(
        shape: [1, NSNumber(value: Self.modelSampleCount), 1],
        dataType: .float32
      )
      for (index, sample) in samples.enumerated() {
        input[index] = NSNumber(value: sample)
      }
      let provider = try MLDictionaryFeatureProvider(dictionary: [
        "input_2": MLFeatureValue(multiArray: input),
      ])
      let prediction = try model.prediction(from: provider)
      guard
        let noteArray = prediction.featureValue(for: "Identity_1")?.multiArrayValue,
        let onsetArray = prediction.featureValue(for: "Identity_2")?.multiArrayValue
      else {
        throw BasicPitchError.inferenceFailed("The model did not return note and onset tensors.")
      }
      return ModelOutputs(
        frameCount: 172,
        notes: extract(noteArray, frameCount: 172, pitchCount: 88),
        onsets: extract(onsetArray, frameCount: 172, pitchCount: 88)
      )
    } catch let error as BasicPitchError {
      throw error
    } catch {
      throw BasicPitchError.inferenceFailed(error.localizedDescription)
    }
  }

  private func containsAudibleSignal(_ samples: [Float]) -> Bool {
    guard !samples.isEmpty else {
      return false
    }

    var squareSum: Float = 0
    var peak: Float = 0
    for sample in samples {
      let absoluteSample = abs(sample)
      squareSum += sample * sample
      peak = max(peak, absoluteSample)
    }

    let rms = sqrt(squareSum / Float(samples.count))
    return rms >= Self.minimumWindowRMS || peak >= Self.minimumWindowPeak
  }

  private func convertToModelSamples(buffer: AVAudioPCMBuffer) throws -> [Float] {
    guard let modelFormat = modelAudioFormat,
          let converter = recordingConverter
    else {
      throw BasicPitchError.audioConversionFailed("The audio converter is not available.")
    }

    let ratio = modelFormat.sampleRate / buffer.format.sampleRate
    let outputCapacity = AVAudioFrameCount(ceil(Double(buffer.frameLength) * ratio)) + 32
    guard let outputBuffer = AVAudioPCMBuffer(
      pcmFormat: modelFormat,
      frameCapacity: outputCapacity
    ) else {
      throw BasicPitchError.audioConversionFailed("Unable to allocate an audio buffer.")
    }

    var didProvideInput = false
    var conversionError: NSError?
    let status = converter.convert(to: outputBuffer, error: &conversionError) { _, inputStatus in
      if didProvideInput {
        inputStatus.pointee = .noDataNow
        return nil
      }

      didProvideInput = true
      inputStatus.pointee = .haveData
      return buffer
    }

    if let conversionError {
      throw BasicPitchError.audioConversionFailed(conversionError.localizedDescription)
    }
    if status == .error {
      throw BasicPitchError.audioConversionFailed("AVAudioConverter reported an error.")
    }
    guard let channel = outputBuffer.floatChannelData?[0] else {
      return []
    }

    return UnsafeBufferPointer(
      start: channel,
      count: Int(outputBuffer.frameLength)
    ).map { min(1, max(-1, $0)) }
  }

  private static func makeModelAudioFormat() -> AVAudioFormat? {
    AVAudioFormat(
      commonFormat: .pcmFormatFloat32,
      sampleRate: Double(sampleRate),
      channels: 1,
      interleaved: false
    )
  }

  private static func copy(buffer: AVAudioPCMBuffer) -> AVAudioPCMBuffer? {
    guard let copiedBuffer = AVAudioPCMBuffer(
      pcmFormat: buffer.format,
      frameCapacity: buffer.frameLength
    ) else {
      return nil
    }

    copiedBuffer.frameLength = buffer.frameLength
    let sourceBuffers = UnsafeMutableAudioBufferListPointer(buffer.mutableAudioBufferList)
    let copiedBuffers = UnsafeMutableAudioBufferListPointer(copiedBuffer.mutableAudioBufferList)
    for index in 0 ..< min(sourceBuffers.count, copiedBuffers.count) {
      guard let sourceData = sourceBuffers[index].mData,
            let copiedData = copiedBuffers[index].mData
      else {
        continue
      }

      let byteCount = Int(sourceBuffers[index].mDataByteSize)
      memcpy(copiedData, sourceData, byteCount)
      copiedBuffers[index].mDataByteSize = sourceBuffers[index].mDataByteSize
    }

    return copiedBuffer
  }

  private func makeNoteRecords(notes: [TimedNote]) -> [DetectionNoteRecord] {
    notes.sorted {
      if $0.startTimeMs == $1.startTimeMs {
        return $0.midiPitch < $1.midiPitch
      }
      return $0.startTimeMs < $1.startTimeMs
    }.enumerated().map { offset, note in
      let record = DetectionNoteRecord()
      record.id = offset + 1
      record.midiPitch = note.midiPitch
      record.startTimeMs = note.startTimeMs
      record.endTimeMs = note.endTimeMs
      record.durationMs = note.durationMs
      record.confidence = Double(note.confidence)
      record.velocity = note.velocity
      return record
    }
  }

  private func merge(notes: [TimedNote]) -> [TimedNote] {
    let sortedNotes = notes.sorted {
      if $0.midiPitch == $1.midiPitch {
        return $0.startTimeMs < $1.startTimeMs
      }
      return $0.midiPitch < $1.midiPitch
    }
    var merged: [TimedNote] = []

    for note in sortedNotes {
      if let index = merged.lastIndex(where: { candidate in
        candidate.midiPitch == note.midiPitch
          && note.startTimeMs <= candidate.endTimeMs + 240
      }) {
        let existing = merged[index]
        let confidence = max(existing.confidence, note.confidence)
        merged[index] = TimedNote(
          midiPitch: existing.midiPitch,
          startTimeMs: min(existing.startTimeMs, note.startTimeMs),
          endTimeMs: max(existing.endTimeMs, note.endTimeMs),
          confidence: confidence
        )
      } else {
        merged.append(note)
      }
    }

    return merged.sorted {
      if $0.startTimeMs == $1.startTimeMs {
        return $0.midiPitch < $1.midiPitch
      }
      return $0.startTimeMs < $1.startTimeMs
    }
  }

  private func prepareRecordingArtifact() throws {
    do {
      try FileManager.default.createDirectory(
        at: artifactDirectoryURL,
        withIntermediateDirectories: true
      )
      if FileManager.default.fileExists(atPath: recordingFileURL.path) {
        try FileManager.default.removeItem(at: recordingFileURL)
      }
    } catch {
      throw BasicPitchError.audioStartFailed("Could not prepare recording file: \(error.localizedDescription)")
    }
  }

  private func writeRecordingFile(samples: [Float]) throws {
    do {
      try FileManager.default.createDirectory(
        at: artifactDirectoryURL,
        withIntermediateDirectories: true
      )

      var data = wavHeader(sampleCount: samples.count, sampleRate: Self.sampleRate)
      for sample in samples {
        let clamped = min(max(sample, -1.0), 1.0)
        let scaled = Int16(clamped * Float(Int16.max))
        var littleEndianSample = scaled.littleEndian
        withUnsafeBytes(of: &littleEndianSample) { bytes in
          data.append(contentsOf: bytes)
        }
      }

      try data.write(to: recordingFileURL, options: .atomic)
    } catch {
      throw BasicPitchError.recordingUnavailable("Could not write recording file: \(error.localizedDescription)")
    }
  }

  private func wavHeader(sampleCount: Int, sampleRate: Int) -> Data {
    let channelCount = 1
    let bitsPerSample = 16
    let bytesPerSample = bitsPerSample / 8
    let byteRate = sampleRate * channelCount * bytesPerSample
    let blockAlign = channelCount * bytesPerSample
    let dataSize = sampleCount * bytesPerSample
    let riffSize = 36 + dataSize
    var data = Data()

    func appendString(_ value: String) {
      data.append(Data(value.utf8))
    }

    func appendUInt16(_ value: UInt16) {
      var littleEndianValue = value.littleEndian
      withUnsafeBytes(of: &littleEndianValue) { data.append(contentsOf: $0) }
    }

    func appendUInt32(_ value: UInt32) {
      var littleEndianValue = value.littleEndian
      withUnsafeBytes(of: &littleEndianValue) { data.append(contentsOf: $0) }
    }

    appendString("RIFF")
    appendUInt32(UInt32(riffSize))
    appendString("WAVE")
    appendString("fmt ")
    appendUInt32(16)
    appendUInt16(1)
    appendUInt16(UInt16(channelCount))
    appendUInt32(UInt32(sampleRate))
    appendUInt32(UInt32(byteRate))
    appendUInt16(UInt16(blockAlign))
    appendUInt16(UInt16(bitsPerSample))
    appendString("data")
    appendUInt32(UInt32(dataSize))

    return data
  }

  private func emit(_ result: DetectionResultRecord) {
    let payload: [String: Any] = [
      "recognitionId": result.recognitionId,
      "detectionId": result.detectionId,
      "type": result.type,
      "recordedDurationMs": result.recordedDurationMs,
      "windowStartMs": result.windowStartMs,
      "windowEndMs": result.windowEndMs,
      "processingDurationMs": result.processingDurationMs,
      "notes": result.notes.map { note in
        [
          "id": note.id,
          "midiPitch": note.midiPitch,
          "startTimeMs": note.startTimeMs,
          "endTimeMs": note.endTimeMs,
          "durationMs": note.durationMs,
          "confidence": note.confidence,
          "velocity": note.velocity,
        ]
      },
    ]

    DispatchQueue.main.async { [weak self] in
      self?.onDetectionFinish?(payload)
    }
  }

  private func milliseconds(forSampleCount sampleCount: Int) -> Double {
    Double(sampleCount) / Double(Self.sampleRate) * 1_000
  }

  private static func sampleCount(forMilliseconds milliseconds: Double) -> Int {
    max(1, Int((milliseconds / 1_000 * Double(sampleRate)).rounded()))
  }

  private func extractFrames(
    _ values: [Float],
    startFrame: Int,
    frameCount: Int,
    pitchCount: Int
  ) -> [Float] {
    var frames: [Float] = []
    frames.reserveCapacity(frameCount * pitchCount)
    for frame in startFrame ..< (startFrame + frameCount) {
      for pitch in 0 ..< pitchCount {
        frames.append(values[frame * pitchCount + pitch])
      }
    }
    return frames
  }

  private func extract(
    _ array: MLMultiArray,
    frameCount: Int,
    pitchCount: Int
  ) -> [Float] {
    var values: [Float] = []
    values.reserveCapacity(frameCount * pitchCount)
    for frame in 0 ..< frameCount {
      for pitch in 0 ..< pitchCount {
        values.append(array[frame * pitchCount + pitch].floatValue)
      }
    }
    return values
  }

  private func validate(model: MLModel) throws {
    guard
      let input = model.modelDescription.inputDescriptionsByName["input_2"],
      let inputConstraint = input.multiArrayConstraint
    else {
      throw BasicPitchError.modelValidationFailed("Missing input_2.")
    }
    try validateShape(inputConstraint.shape, expected: [1, 43_844, 1], name: "input_2")

    let expectedOutputs = [
      "Identity": [1, 172, 264],
      "Identity_1": [1, 172, 88],
      "Identity_2": [1, 172, 88],
    ]
    for (name, expectedShape) in expectedOutputs {
      guard
        let output = model.modelDescription.outputDescriptionsByName[name],
        let constraint = output.multiArrayConstraint
      else {
        throw BasicPitchError.modelValidationFailed("Missing \(name).")
      }
      try validateShape(constraint.shape, expected: expectedShape, name: name)
    }
  }

  private func validateShape(
    _ shape: [NSNumber],
    expected: [Int],
    name: String
  ) throws {
    let actual = shape.map(\.intValue)
    guard actual == expected else {
      throw BasicPitchError.modelValidationFailed(
        "\(name) has shape \(actual), expected \(expected)."
      )
    }
  }

  private func findModelURL() -> URL? {
    let candidateBundles = [Bundle.main, Bundle(for: BasicPitchService.self)]
      + Bundle.allFrameworks
      + Bundle.allBundles
    for bundle in candidateBundles {
      if let url = bundle.url(forResource: "nmp", withExtension: "mlmodelc") {
        return url
      }
    }
    return nil
  }

  private func requestMicrophonePermission() async -> Bool {
    let session = AVAudioSession.sharedInstance()
    switch session.recordPermission {
    case .granted:
      return true
    case .denied:
      return false
    case .undetermined:
      return await withCheckedContinuation { continuation in
        session.requestRecordPermission { granted in
          continuation.resume(returning: granted)
        }
      }
    @unknown default:
      return false
    }
  }

  @MainActor
  private static func topViewController(base: UIViewController? = nil) -> UIViewController? {
    let root = base ?? UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .first { $0.isKeyWindow }?
      .rootViewController

    guard let root else {
      return nil
    }

    if let navigation = root as? UINavigationController {
      return topViewController(base: navigation.visibleViewController)
    }

    if let tab = root as? UITabBarController {
      return topViewController(base: tab.selectedViewController)
    }

    if let presented = root.presentedViewController {
      return topViewController(base: presented)
    }

    return root
  }

  private func perform<T>(_ operation: @escaping () throws -> T) async throws -> T {
    try await withCheckedThrowingContinuation { continuation in
      workQueue.async {
        do {
          try continuation.resume(returning: operation())
        } catch {
          continuation.resume(throwing: error)
        }
      }
    }
  }
}

// swiftlint:enable file_length type_body_length
