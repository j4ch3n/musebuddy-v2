import AVFoundation
import CoreML
import Foundation

private enum DiagnosticError: LocalizedError {
  case invalidArguments
  case missingFeature(String)
  case unexpectedShape(name: String, actual: [Int], expected: [Int])
  case audioConversionFailed(String)
  case inferenceFailed(String)

  var errorDescription: String? {
    switch self {
    case .invalidArguments:
      """
      Usage: swift diagnose-basic-pitch.swift /path/to/nmp.mlmodelc [/path/to/audio] [--interval seconds] [--window seconds]
        --interval  Simulated live detection cadence in seconds. Default: 0.5.
        --window    Rolling audio window size in seconds. Default: 2.9.
      """
    case let .missingFeature(name):
      "The model feature '\(name)' is missing."
    case let .unexpectedShape(name, actual, expected):
      "\(name) has shape \(actual), expected \(expected)."
    case let .audioConversionFailed(detail):
      "Audio conversion failed: \(detail)"
    case let .inferenceFailed(detail):
      "Basic Pitch inference failed: \(detail)"
    }
  }
}

private struct ModelOutputs {
  let frameCount: Int
  let notes: [Float]
  let onsets: [Float]
}

private struct DecodedNote {
  let startFrame: Int
  let endFrame: Int
  let midiPitch: Int
  let confidence: Float
}

private struct TranscriptionNote {
  let midiPitch: Int
  let startTimeMs: Double
  let endTimeMs: Double
  let durationMs: Double
  let confidence: Float
  let velocity: Int
}

private struct RollingDetection {
  let detectionId: Int
  let windowStartMs: Double
  let windowEndMs: Double
  let notes: [TranscriptionNote]
}

private struct DiagnosticOptions {
  let compiledModelURL: URL
  let audioURL: URL
  let detectionIntervalSeconds: Double
  let rollingWindowSeconds: Double
}

private enum BasicPitchDecoder {
  private static let pitchCount = 88
  private static let midiOffset = 21
  private static let frameThreshold: Float = 0.3
  private static let onsetThreshold: Float = 0.5
  private static let minimumNoteLength = 11
  private static let energyTolerance = 11
  private static let fftHop = 256
  private static let sampleRate = 22_050
  private static let annotationFramesPerWindow = 172
  private static let audioSampleCount = 43_844
  private static let alignmentOffset = 0.0018

  static func decode(_ output: ModelOutputs) -> [DecodedNote] {
    guard output.frameCount > 2 else {
      return []
    }

    let inferredOnsets = inferOnsets(
      onsets: output.onsets,
      frames: output.notes,
      frameCount: output.frameCount
    )
    var remainingEnergy = output.notes
    var events: [DecodedNote] = []
    var onsetPeaks: [(time: Int, pitch: Int)] = []

    for time in 1 ..< (output.frameCount - 1) {
      for pitch in 0 ..< pitchCount {
        let value = inferredOnsets[index(time, pitch)]
        if value >= onsetThreshold,
           value > inferredOnsets[index(time - 1, pitch)],
           value > inferredOnsets[index(time + 1, pitch)] {
          onsetPeaks.append((time, pitch))
        }
      }
    }

    for peak in onsetPeaks.reversed() {
      guard peak.time < output.frameCount - 1 else {
        continue
      }

      var time = peak.time + 1
      var quietFrames = 0
      while time < output.frameCount - 1, quietFrames < energyTolerance {
        if remainingEnergy[index(time, peak.pitch)] < frameThreshold {
          quietFrames += 1
        } else {
          quietFrames = 0
        }
        time += 1
      }
      time -= quietFrames

      guard time - peak.time > minimumNoteLength else {
        continue
      }

      let confidence = mean(output.notes, from: peak.time, to: time, pitch: peak.pitch)
      clearEnergy(&remainingEnergy, from: peak.time, to: time, pitch: peak.pitch)
      events.append(
        DecodedNote(
          startFrame: peak.time,
          endFrame: time,
          midiPitch: peak.pitch + midiOffset,
          confidence: confidence
        )
      )
    }

    while let maximum = maximumEnergy(in: remainingEnergy),
          maximum.value > frameThreshold {
      remainingEnergy[index(maximum.time, maximum.pitch)] = 0

      var forwardTime = maximum.time + 1
      var quietFrames = 0
      while forwardTime < output.frameCount - 1, quietFrames < energyTolerance {
        if remainingEnergy[index(forwardTime, maximum.pitch)] < frameThreshold {
          quietFrames += 1
        } else {
          quietFrames = 0
        }
        clearEnergy(&remainingEnergy, from: forwardTime, to: forwardTime + 1, pitch: maximum.pitch)
        forwardTime += 1
      }
      let end = forwardTime - 1 - quietFrames

      var backwardTime = maximum.time - 1
      quietFrames = 0
      while backwardTime > 0, quietFrames < energyTolerance {
        if remainingEnergy[index(backwardTime, maximum.pitch)] < frameThreshold {
          quietFrames += 1
        } else {
          quietFrames = 0
        }
        clearEnergy(&remainingEnergy, from: backwardTime, to: backwardTime + 1, pitch: maximum.pitch)
        backwardTime -= 1
      }
      let start = backwardTime + 1 + quietFrames

      guard end - start > minimumNoteLength else {
        continue
      }

      events.append(
        DecodedNote(
          startFrame: start,
          endFrame: end,
          midiPitch: maximum.pitch + midiOffset,
          confidence: mean(output.notes, from: start, to: end, pitch: maximum.pitch)
        )
      )
    }

    return events.sorted {
      if $0.startFrame == $1.startFrame {
        return $0.midiPitch < $1.midiPitch
      }
      return $0.startFrame < $1.startFrame
    }
  }

  static func time(forFrame frame: Int) -> Double {
    let originalTime = Double(frame * fftHop) / Double(sampleRate)
    let windowNumber = floor(Double(frame) / Double(annotationFramesPerWindow))
    let windowOffset =
      (Double(fftHop) / Double(sampleRate))
        * (Double(annotationFramesPerWindow) - (Double(audioSampleCount) / Double(fftHop)))
        + alignmentOffset
    return max(0, originalTime - (windowOffset * windowNumber))
  }

  private static func inferOnsets(
    onsets: [Float],
    frames: [Float],
    frameCount: Int
  ) -> [Float] {
    var frameDifferences = [Float](repeating: 0, count: onsets.count)
    var maximumOnset: Float = 0
    var maximumDifference: Float = 0

    for value in onsets {
      maximumOnset = max(maximumOnset, value)
    }

    for time in 2 ..< frameCount {
      for pitch in 0 ..< pitchCount {
        let current = frames[index(time, pitch)]
        let oneFrameDifference = current - frames[index(time - 1, pitch)]
        let twoFrameDifference = current - frames[index(time - 2, pitch)]
        let difference = max(0, min(oneFrameDifference, twoFrameDifference))
        frameDifferences[index(time, pitch)] = difference
        maximumDifference = max(maximumDifference, difference)
      }
    }

    guard maximumDifference > 0 else {
      return onsets
    }

    return zip(onsets, frameDifferences).map { onset, difference in
      max(onset, maximumOnset * difference / maximumDifference)
    }
  }

  private static func clearEnergy(
    _ energy: inout [Float],
    from start: Int,
    to end: Int,
    pitch: Int
  ) {
    guard start < end else {
      return
    }
    for time in start ..< end {
      energy[index(time, pitch)] = 0
      if pitch > 0 {
        energy[index(time, pitch - 1)] = 0
      }
      if pitch < pitchCount - 1 {
        energy[index(time, pitch + 1)] = 0
      }
    }
  }

  private static func mean(_ values: [Float], from start: Int, to end: Int, pitch: Int) -> Float {
    guard end > start else {
      return 0
    }
    var sum: Float = 0
    for time in start ..< end {
      sum += values[index(time, pitch)]
    }
    return sum / Float(end - start)
  }

  private static func maximumEnergy(in energy: [Float]) -> (
    time: Int,
    pitch: Int,
    value: Float
  )? {
    guard !energy.isEmpty else {
      return nil
    }
    var maximumIndex = 0
    var maximumValue = energy[0]
    for candidate in 1 ..< energy.count where energy[candidate] > maximumValue {
      maximumIndex = candidate
      maximumValue = energy[candidate]
    }
    return (maximumIndex / pitchCount, maximumIndex % pitchCount, maximumValue)
  }

  private static func index(_ time: Int, _ pitch: Int) -> Int {
    time * pitchCount + pitch
  }
}

private let sampleRate = 22_050
private let modelSampleCount = 43_844
private let defaultDetectionIntervalSeconds = 0.5
private let defaultRollingWindowSeconds = 2.9
private let minimumWindowRMS: Float = 0.0015
private let minimumWindowPeak: Float = 0.02
private let minimumNoteConfidence: Float = 0.45
private let commitDelayMs = 1_000.0
private let maximumAnalysisIntervalSeconds = 0.5

private func shape(of array: MLMultiArray) -> [Int] {
  array.shape.map(\.intValue)
}

private func validateShape(
  _ array: MLMultiArray,
  name: String,
  expected: [Int]
) throws {
  let actual = shape(of: array)
  guard actual == expected else {
    throw DiagnosticError.unexpectedShape(name: name, actual: actual, expected: expected)
  }
}

private func validate(model: MLModel) throws {
  guard
    let inputDescription = model.modelDescription.inputDescriptionsByName["input_2"],
    let inputConstraint = inputDescription.multiArrayConstraint
  else {
    throw DiagnosticError.missingFeature("input_2")
  }

  let inputShape = inputConstraint.shape.map(\.intValue)
  guard inputShape == [1, 43_844, 1] else {
    throw DiagnosticError.unexpectedShape(
      name: "input_2",
      actual: inputShape,
      expected: [1, 43_844, 1]
    )
  }

  let expectedOutputs = [
    "Identity": [1, 172, 264],
    "Identity_1": [1, 172, 88],
    "Identity_2": [1, 172, 88],
  ]
  for (name, expectedShape) in expectedOutputs {
    guard
      let outputDescription = model.modelDescription.outputDescriptionsByName[name],
      let outputConstraint = outputDescription.multiArrayConstraint
    else {
      throw DiagnosticError.missingFeature(name)
    }

    let actualShape = outputConstraint.shape.map(\.intValue)
    guard actualShape == expectedShape else {
      throw DiagnosticError.unexpectedShape(name: name, actual: actualShape, expected: expectedShape)
    }
  }
}

private enum AudioFileKind {
  case mp3
  case wave
}

private func audioFileKind(for url: URL) -> AudioFileKind? {
  guard
    let handle = try? FileHandle(forReadingFrom: url)
  else {
    return nil
  }
  defer {
    try? handle.close()
  }

  let header = handle.readData(ofLength: 12)
  guard header.count >= 12 else {
    return nil
  }

  let bytes = [UInt8](header)
  if bytes[0 ..< 4].elementsEqual([0x52, 0x49, 0x46, 0x46]),
     bytes[8 ..< 12].elementsEqual([0x57, 0x41, 0x56, 0x45]) {
    return .wave
  }
  if bytes[0] == 0x49, bytes[1] == 0x44, bytes[2] == 0x33 {
    return .mp3
  }
  if bytes[0] == 0xFF, (bytes[1] & 0xE0) == 0xE0 {
    return .mp3
  }
  return nil
}

private func littleEndianUInt16(_ bytes: [UInt8], _ offset: Int) -> UInt16 {
  UInt16(bytes[offset]) | (UInt16(bytes[offset + 1]) << 8)
}

private func littleEndianUInt32(_ bytes: [UInt8], _ offset: Int) -> UInt32 {
  UInt32(bytes[offset])
    | (UInt32(bytes[offset + 1]) << 8)
    | (UInt32(bytes[offset + 2]) << 16)
    | (UInt32(bytes[offset + 3]) << 24)
}

private func resample(_ samples: [Float], from sourceSampleRate: Int) -> [Float] {
  guard sourceSampleRate != sampleRate, !samples.isEmpty else {
    return samples
  }

  let outputCount = Int((Double(samples.count) * Double(sampleRate) / Double(sourceSampleRate)).rounded())
  guard outputCount > 1 else {
    return samples
  }

  return (0 ..< outputCount).map { outputIndex in
    let sourcePosition = Double(outputIndex) * Double(sourceSampleRate) / Double(sampleRate)
    let lowerIndex = min(samples.count - 1, Int(sourcePosition.rounded(.down)))
    let upperIndex = min(samples.count - 1, lowerIndex + 1)
    let fraction = Float(sourcePosition - Double(lowerIndex))
    return samples[lowerIndex] + ((samples[upperIndex] - samples[lowerIndex]) * fraction)
  }
}

private func convertWavePCMToModelSamples(url: URL) throws -> [Float] {
  let bytes = try [UInt8](Data(contentsOf: url))
  guard bytes.count >= 44,
        bytes[0 ..< 4].elementsEqual([0x52, 0x49, 0x46, 0x46]),
        bytes[8 ..< 12].elementsEqual([0x57, 0x41, 0x56, 0x45])
  else {
    throw DiagnosticError.audioConversionFailed("The WAV header is invalid.")
  }

  var offset = 12
  var audioFormat: UInt16?
  var channelCount: UInt16?
  var sourceSampleRate: UInt32?
  var bitsPerSample: UInt16?
  var dataOffset: Int?
  var dataSize: Int?

  while offset + 8 <= bytes.count {
    let chunkID = String(bytes: bytes[offset ..< offset + 4], encoding: .ascii)
    let chunkSize = Int(littleEndianUInt32(bytes, offset + 4))
    let chunkStart = offset + 8
    let chunkEnd = chunkStart + chunkSize
    guard chunkEnd <= bytes.count else {
      throw DiagnosticError.audioConversionFailed("The WAV chunk size is invalid.")
    }

    if chunkID == "fmt " {
      guard chunkSize >= 16 else {
        throw DiagnosticError.audioConversionFailed("The WAV fmt chunk is too short.")
      }
      audioFormat = littleEndianUInt16(bytes, chunkStart)
      channelCount = littleEndianUInt16(bytes, chunkStart + 2)
      sourceSampleRate = littleEndianUInt32(bytes, chunkStart + 4)
      bitsPerSample = littleEndianUInt16(bytes, chunkStart + 14)
    } else if chunkID == "data" {
      dataOffset = chunkStart
      dataSize = chunkSize
    }

    offset = chunkEnd + (chunkSize % 2)
  }

  guard audioFormat == 1 else {
    throw DiagnosticError.audioConversionFailed("Only PCM WAV files are supported by the diagnostic WAV reader.")
  }
  guard let channelCount, channelCount > 0,
        let sourceSampleRate,
        let bitsPerSample,
        bitsPerSample == 16,
        let dataOffset,
        let dataSize
  else {
    throw DiagnosticError.audioConversionFailed("The WAV fmt or data chunk is missing.")
  }

  let bytesPerSample = Int(bitsPerSample / 8)
  let frameSize = Int(channelCount) * bytesPerSample
  let frameCount = dataSize / frameSize
  var samples: [Float] = []
  samples.reserveCapacity(frameCount)

  for frameIndex in 0 ..< frameCount {
    let frameOffset = dataOffset + (frameIndex * frameSize)
    var mixedSample: Float = 0
    for channelIndex in 0 ..< Int(channelCount) {
      let sampleOffset = frameOffset + (channelIndex * bytesPerSample)
      let unsignedValue = littleEndianUInt16(bytes, sampleOffset)
      let signedValue = Int16(bitPattern: unsignedValue)
      mixedSample += Float(signedValue) / Float(Int16.max)
    }
    samples.append(min(1, max(-1, mixedSample / Float(channelCount))))
  }

  return resample(samples, from: Int(sourceSampleRate))
}

private func convertAudioToModelSamples(url: URL) throws -> [Float] {
  do {
    if audioFileKind(for: url) == .wave {
      return try convertWavePCMToModelSamples(url: url)
    }

    let inputFile = try AVAudioFile(forReading: url)
    guard
      let outputFormat = AVAudioFormat(
        commonFormat: .pcmFormatFloat32,
        sampleRate: Double(sampleRate),
        channels: 1,
        interleaved: false
      ),
      let converter = AVAudioConverter(from: inputFile.processingFormat, to: outputFormat)
    else {
      throw DiagnosticError.audioConversionFailed("Unable to create the audio converter.")
    }

    var samples: [Float] = []
    let inputCapacity: AVAudioFrameCount = 4_096
    var reachedEnd = false

    while !reachedEnd {
      let ratio = outputFormat.sampleRate / inputFile.processingFormat.sampleRate
      let outputCapacity = AVAudioFrameCount(ceil(Double(inputCapacity) * ratio)) + 32
      guard let outputBuffer = AVAudioPCMBuffer(
        pcmFormat: outputFormat,
        frameCapacity: outputCapacity
      ) else {
        throw DiagnosticError.audioConversionFailed("Unable to allocate an audio buffer.")
      }

      var inputSupplied = false
      var conversionError: NSError?
      let status = converter.convert(to: outputBuffer, error: &conversionError) { _, inputStatus in
        if inputSupplied {
          inputStatus.pointee = .noDataNow
          return nil
        }

        let remaining = inputFile.length - inputFile.framePosition
        guard remaining > 0 else {
          inputStatus.pointee = .endOfStream
          reachedEnd = true
          return nil
        }

        let frameCount = min(inputCapacity, AVAudioFrameCount(remaining))
        guard let inputBuffer = AVAudioPCMBuffer(
          pcmFormat: inputFile.processingFormat,
          frameCapacity: frameCount
        ) else {
          inputStatus.pointee = .endOfStream
          reachedEnd = true
          return nil
        }

        do {
          try inputFile.read(into: inputBuffer, frameCount: frameCount)
          inputSupplied = true
          inputStatus.pointee = .haveData
          return inputBuffer
        } catch {
          conversionError = error as NSError
          inputStatus.pointee = .endOfStream
          reachedEnd = true
          return nil
        }
      }

      if let conversionError {
        throw conversionError
      }
      if status == .error {
        throw DiagnosticError.audioConversionFailed("AVAudioConverter reported an error.")
      }

      if let channel = outputBuffer.floatChannelData?[0] {
        samples.append(contentsOf: UnsafeBufferPointer(
          start: channel,
          count: Int(outputBuffer.frameLength)
        ))
      }
      if status == .endOfStream {
        reachedEnd = true
      }
    }

    return samples
  } catch let error as DiagnosticError {
    throw error
  } catch {
    throw DiagnosticError.audioConversionFailed(error.localizedDescription)
  }
}

private func extract(
  _ array: MLMultiArray,
  startFrame: Int,
  frameCount: Int,
  pitchCount: Int
) -> [Float] {
  var values = [Float]()
  values.reserveCapacity(frameCount * pitchCount)
  for frame in startFrame ..< (startFrame + frameCount) {
    for pitch in 0 ..< pitchCount {
      let offset = frame * pitchCount + pitch
      values.append(array[offset].floatValue)
    }
  }
  return values
}

private func runInference(samples: [Float], model: MLModel) throws -> ModelOutputs {
  guard !samples.isEmpty else {
    return ModelOutputs(frameCount: 0, notes: [], onsets: [])
  }

  let sampleCount = modelSampleCount
  let overlapSampleCount = 30 * 256
  let leadingPadding = overlapSampleCount / 2
  let hopSize = sampleCount - overlapSampleCount
  let framesPerWindow = 172
  let overlapFramesPerSide = 15
  let retainedFramesPerWindow = framesPerWindow - (overlapFramesPerSide * 2)
  var paddedSamples = [Float](repeating: 0, count: leadingPadding)
  paddedSamples.append(contentsOf: samples)
  var noteWindows: [[Float]] = []
  var onsetWindows: [[Float]] = []
  var windowStart = 0

  do {
    while windowStart < paddedSamples.count {
      let input = try MLMultiArray(
        shape: [1, NSNumber(value: sampleCount), 1],
        dataType: .float32
      )
      let inputSamples = input.dataPointer.bindMemory(to: Float.self, capacity: sampleCount)
      for sampleIndex in 0 ..< sampleCount {
        let sourceIndex = windowStart + sampleIndex
        inputSamples[sampleIndex] = sourceIndex < paddedSamples.count ? paddedSamples[sourceIndex] : 0
      }

      let provider = try MLDictionaryFeatureProvider(dictionary: [
        "input_2": MLFeatureValue(multiArray: input),
      ])
      let prediction = try model.prediction(from: provider)
      guard
        let noteArray = prediction.featureValue(for: "Identity_1")?.multiArrayValue,
        let onsetArray = prediction.featureValue(for: "Identity_2")?.multiArrayValue
      else {
        throw DiagnosticError.inferenceFailed("The model did not return note and onset tensors.")
      }

      try validateShape(noteArray, name: "Identity_1", expected: [1, 172, 88])
      try validateShape(onsetArray, name: "Identity_2", expected: [1, 172, 88])
      noteWindows.append(
        extract(
          noteArray,
          startFrame: overlapFramesPerSide,
          frameCount: retainedFramesPerWindow,
          pitchCount: 88
        )
      )
      onsetWindows.append(
        extract(
          onsetArray,
          startFrame: overlapFramesPerSide,
          frameCount: retainedFramesPerWindow,
          pitchCount: 88
        )
      )
      windowStart += hopSize
    }
  } catch let error as DiagnosticError {
    throw error
  } catch {
    throw DiagnosticError.inferenceFailed(error.localizedDescription)
  }

  let expectedFrameCount = Int(
    (Double(samples.count) / Double(hopSize)) * Double(retainedFramesPerWindow)
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

private func transcribe(audioURL: URL, model: MLModel) throws -> (durationMs: Double, notes: [TranscriptionNote]) {
  let samples = try convertAudioToModelSamples(url: audioURL)
  let durationSeconds = Double(samples.count) / Double(sampleRate)
  let output = try runInference(samples: samples, model: model)
  let decodedNotes = BasicPitchDecoder.decode(output)
  let notes = decodedNotes.compactMap { note -> TranscriptionNote? in
    let start = min(durationSeconds, BasicPitchDecoder.time(forFrame: note.startFrame))
    let end = min(durationSeconds, BasicPitchDecoder.time(forFrame: note.endFrame))
    guard end > start else {
      return nil
    }

    return TranscriptionNote(
      midiPitch: note.midiPitch,
      startTimeMs: start * 1_000,
      endTimeMs: end * 1_000,
      durationMs: (end - start) * 1_000,
      confidence: note.confidence,
      velocity: min(127, max(0, Int((note.confidence * 127).rounded())))
    )
  }

  return (durationSeconds * 1_000, notes)
}

private func transcribeWindow(
  samples: ArraySlice<Float>,
  absoluteStartSample: Int,
  absoluteEndSample: Int,
  model: MLModel
) throws -> [TranscriptionNote] {
  guard containsAudibleSignal(samples) else {
    return []
  }

  let output = try runInference(samples: Array(samples), model: model)
  let decodedNotes = BasicPitchDecoder.decode(output)
  let absoluteStartSeconds = Double(absoluteStartSample) / Double(sampleRate)
  let absoluteEndSeconds = Double(absoluteEndSample) / Double(sampleRate)

  return decodedNotes.compactMap { note -> TranscriptionNote? in
    let start = min(absoluteEndSeconds, absoluteStartSeconds + BasicPitchDecoder.time(forFrame: note.startFrame))
    let end = min(absoluteEndSeconds, absoluteStartSeconds + BasicPitchDecoder.time(forFrame: note.endFrame))
    guard end > start else {
      return nil
    }

    return TranscriptionNote(
      midiPitch: note.midiPitch,
      startTimeMs: start * 1_000,
      endTimeMs: end * 1_000,
      durationMs: (end - start) * 1_000,
      confidence: note.confidence,
      velocity: min(127, max(0, Int((note.confidence * 127).rounded())))
    )
  }
}

private func containsAudibleSignal(_ samples: ArraySlice<Float>) -> Bool {
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
  return rms >= minimumWindowRMS || peak >= minimumWindowPeak
}

private func merge(_ notes: [TranscriptionNote]) -> [TranscriptionNote] {
  let sortedNotes = notes.sorted {
    if $0.midiPitch == $1.midiPitch {
      return $0.startTimeMs < $1.startTimeMs
    }
    return $0.midiPitch < $1.midiPitch
  }
  var merged: [TranscriptionNote] = []

  for note in sortedNotes {
    if let index = merged.lastIndex(where: { candidate in
      candidate.midiPitch == note.midiPitch
        && note.startTimeMs <= candidate.endTimeMs + 240
    }) {
      let existing = merged[index]
      let confidence = max(existing.confidence, note.confidence)
      let startTimeMs = min(existing.startTimeMs, note.startTimeMs)
      let endTimeMs = max(existing.endTimeMs, note.endTimeMs)
      merged[index] = TranscriptionNote(
        midiPitch: existing.midiPitch,
        startTimeMs: startTimeMs,
        endTimeMs: endTimeMs,
        durationMs: endTimeMs - startTimeMs,
        confidence: confidence,
        velocity: min(127, max(0, Int((confidence * 127).rounded())))
      )
    } else {
      if note.confidence >= minimumNoteConfidence {
        merged.append(note)
      }
    }
  }

  return merged.sorted {
    if $0.startTimeMs == $1.startTimeMs {
      return $0.midiPitch < $1.midiPitch
    }
    return $0.startTimeMs < $1.startTimeMs
  }
}

private func rollingDetectionEndSamples(
  sampleCount: Int,
  intervalSamples: Int,
  rollingWindowSamples: Int
) -> [Int] {
  guard sampleCount > 0 else {
    return []
  }

  var endSamples: [Int] = []
  var current = min(rollingWindowSamples, sampleCount)
  while current < sampleCount {
    endSamples.append(current)
    current += intervalSamples
  }
  if endSamples.last != sampleCount {
    endSamples.append(sampleCount)
  }
  return endSamples
}

private func notesByAnalysisEndSample(
  samples: [Float],
  analysisEndSamples: [Int],
  rollingWindowSamples: Int,
  model: MLModel
) throws -> [(endSample: Int, windowStartSample: Int, notes: [TranscriptionNote])] {
  try analysisEndSamples.map { endSample in
    let startSample = max(0, endSample - rollingWindowSamples)
    let notes = try transcribeWindow(
      samples: samples[startSample ..< endSample],
      absoluteStartSample: startSample,
      absoluteEndSample: endSample,
      model: model
    )
    return (endSample, startSample, notes)
  }
}

private func transcribeRolling(
  audioURL: URL,
  model: MLModel,
  detectionIntervalSeconds: Double,
  rollingWindowSeconds: Double
) throws -> (durationMs: Double, detections: [RollingDetection], notes: [TranscriptionNote]) {
  let samples = try convertAudioToModelSamples(url: audioURL)
  let durationMs = Double(samples.count) / Double(sampleRate) * 1_000
  let intervalSamples = max(1, Int((detectionIntervalSeconds * Double(sampleRate)).rounded()))
  let analysisIntervalSeconds = min(detectionIntervalSeconds, maximumAnalysisIntervalSeconds)
  let analysisIntervalSamples = max(1, Int((analysisIntervalSeconds * Double(sampleRate)).rounded()))
  let rollingWindowSamples = max(modelSampleCount, Int((rollingWindowSeconds * Double(sampleRate)).rounded()))
  var detections: [RollingDetection] = []
  var committedNotes: [TranscriptionNote] = []
  var lastCommittedTimeMs = 0.0
  let detectionEndSamples = rollingDetectionEndSamples(
    sampleCount: samples.count,
    intervalSamples: intervalSamples,
    rollingWindowSamples: rollingWindowSamples
  )
  let analysisWindows = try notesByAnalysisEndSample(
    samples: samples,
    analysisEndSamples: rollingDetectionEndSamples(
      sampleCount: samples.count,
      intervalSamples: analysisIntervalSamples,
      rollingWindowSamples: rollingWindowSamples
    ),
    rollingWindowSamples: rollingWindowSamples,
    model: model
  )
  var analysisIndex = 0

  for (offset, detectionEndSample) in detectionEndSamples.enumerated() {
    var detectionNotes: [TranscriptionNote] = []
    var detectionWindowStartSample = max(0, detectionEndSample - rollingWindowSamples)
    while analysisIndex < analysisWindows.count,
          analysisWindows[analysisIndex].endSample <= detectionEndSample {
      let analysisWindow = analysisWindows[analysisIndex]
      detectionWindowStartSample = min(detectionWindowStartSample, analysisWindow.windowStartSample)
      detectionNotes.append(contentsOf: analysisWindow.notes)

      let isFinalAnalysis = analysisIndex == analysisWindows.count - 1
      let analysisEndMs = Double(analysisWindow.endSample) / Double(sampleRate) * 1_000
      let commitThroughMs = isFinalAnalysis ? durationMs : max(0, analysisEndMs - commitDelayMs)
      if commitThroughMs > lastCommittedTimeMs {
        committedNotes.append(contentsOf: analysisWindow.notes.filter { note in
          note.startTimeMs >= lastCommittedTimeMs && note.startTimeMs < commitThroughMs
        })
        lastCommittedTimeMs = commitThroughMs
      }

      analysisIndex += 1
    }

    let windowEndMs = Double(detectionEndSample) / Double(sampleRate) * 1_000
    detections.append(RollingDetection(
      detectionId: offset + 1,
      windowStartMs: Double(detectionWindowStartSample) / Double(sampleRate) * 1_000,
      windowEndMs: windowEndMs,
      notes: merge(detectionNotes)
    ))
  }

  return (durationMs, detections, merge(committedNotes))
}

private func defaultAudioURL() -> URL {
  URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
    .appendingPathComponent("data/test-record.mp3")
}

private func formatMilliseconds(_ value: Double) -> String {
  String(format: "%.1fms", value)
}

private func formatDecimal(_ value: Float) -> String {
  String(format: "%.4f", value)
}

private func parseOptions() throws -> DiagnosticOptions {
  guard CommandLine.arguments.count >= 2 else {
    throw DiagnosticError.invalidArguments
  }

  let compiledURL = URL(fileURLWithPath: CommandLine.arguments[1])
  var audioURL: URL?
  var detectionIntervalSeconds = defaultDetectionIntervalSeconds
  var rollingWindowSeconds = defaultRollingWindowSeconds
  var index = 2

  while index < CommandLine.arguments.count {
    let argument = CommandLine.arguments[index]
    switch argument {
    case "--interval":
      index += 1
      guard index < CommandLine.arguments.count,
            let value = Double(CommandLine.arguments[index]),
            value > 0
      else {
        throw DiagnosticError.invalidArguments
      }
      detectionIntervalSeconds = value
    case "--window":
      index += 1
      guard index < CommandLine.arguments.count,
            let value = Double(CommandLine.arguments[index]),
            value > 0
      else {
        throw DiagnosticError.invalidArguments
      }
      rollingWindowSeconds = value
    default:
      guard audioURL == nil, !argument.hasPrefix("--") else {
        throw DiagnosticError.invalidArguments
      }
      audioURL = URL(fileURLWithPath: argument)
    }
    index += 1
  }

  guard detectionIntervalSeconds <= rollingWindowSeconds else {
    throw DiagnosticError.invalidArguments
  }

  return DiagnosticOptions(
    compiledModelURL: compiledURL,
    audioURL: audioURL ?? defaultAudioURL(),
    detectionIntervalSeconds: detectionIntervalSeconds,
    rollingWindowSeconds: rollingWindowSeconds
  )
}

private func run() throws {
  let options = try parseOptions()

  let configuration = MLModelConfiguration()
  configuration.computeUnits = .cpuOnly
  let model = try MLModel(contentsOf: options.compiledModelURL, configuration: configuration)
  try validate(model: model)

  let result = try transcribeRolling(
    audioURL: options.audioURL,
    model: model,
    detectionIntervalSeconds: options.detectionIntervalSeconds,
    rollingWindowSeconds: options.rollingWindowSeconds
  )

  print("Audio: \(options.audioURL.path)")
  print("Model: \(options.compiledModelURL.path)")
  print("Detection interval: \(String(format: "%.3fs", options.detectionIntervalSeconds))")
  print("Rolling window: \(String(format: "%.3fs", options.rollingWindowSeconds))")
  print("Duration: \(formatMilliseconds(result.durationMs))")
  print("Detections: \(result.detections.count)")
  print("Notes: \(result.notes.count)")

  for detection in result.detections {
    print(
      "detection \(detection.detectionId) | "
        + "window \(formatMilliseconds(detection.windowStartMs))-\(formatMilliseconds(detection.windowEndMs)) | "
        + "raw notes \(detection.notes.count)"
    )
  }

  for note in result.notes {
    print(
      "pitch \(note.midiPitch) | "
        + "start \(formatMilliseconds(note.startTimeMs)) | "
        + "end \(formatMilliseconds(note.endTimeMs)) | "
        + "duration \(formatMilliseconds(note.durationMs)) | "
        + "confidence \(formatDecimal(note.confidence)) | "
        + "velocity \(note.velocity)"
    )
  }
}

do {
  try run()
} catch {
  let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
  FileHandle.standardError.write(Data("FAIL: \(message)\n".utf8))
  exit(1)
}
