import Foundation

struct DecodedAudio {
  let samples: [Float]
  let sampleRate: Double
}

enum DiagnosticError: Error, CustomStringConvertible {
  case message(String)
  var description: String { if case let .message(value) = self { return value }; return "Unknown diagnostic error" }
}

enum WavFileDecoder {
  static func decode(url: URL) throws -> DecodedAudio {
    let data = try Data(contentsOf: url)
    guard data.count >= 44, String(data: data.prefix(4), encoding: .ascii) == "RIFF", String(data: data[8 ..< 12], encoding: .ascii) == "WAVE" else {
      throw DiagnosticError.message("\(url.lastPathComponent) is not a RIFF/WAVE file")
    }
    var offset = 12
    var format: (encoding: UInt16, channels: Int, sampleRate: Double, bitsPerSample: Int)?
    var pcm: Data?
    while offset + 8 <= data.count {
      let chunkID = String(data: data[offset ..< offset + 4], encoding: .ascii)
      let length = Int(readUInt32(data, at: offset + 4))
      let contentStart = offset + 8; let contentEnd = contentStart + length
      guard contentEnd <= data.count else { throw DiagnosticError.message("Malformed WAV chunk in \(url.lastPathComponent)") }
      if chunkID == "fmt ", length >= 16 {
        format = (readUInt16(data, at: contentStart), Int(readUInt16(data, at: contentStart + 2)), Double(readUInt32(data, at: contentStart + 4)), Int(readUInt16(data, at: contentStart + 14)))
      } else if chunkID == "data" { pcm = Data(data[contentStart ..< contentEnd]) }
      offset = contentEnd + length % 2
    }
    guard let format, let pcm, format.channels > 0, format.sampleRate > 0, format.encoding == 1, format.bitsPerSample == 16 else {
      throw DiagnosticError.message("\(url.lastPathComponent) must be 16-bit PCM WAV")
    }
    let bytesPerFrame = format.channels * 2
    guard pcm.count.isMultiple(of: bytesPerFrame) else { throw DiagnosticError.message("Malformed PCM frame data in \(url.lastPathComponent)") }
    var samples: [Float] = []; samples.reserveCapacity(pcm.count / bytesPerFrame)
    for frameOffset in stride(from: 0, to: pcm.count, by: bytesPerFrame) {
      var sum: Float = 0
      for channel in 0 ..< format.channels { sum += Float(Int16(bitPattern: readUInt16(pcm, at: frameOffset + channel * 2))) / 32_768 }
      samples.append(sum / Float(format.channels))
    }
    return DecodedAudio(samples: samples, sampleRate: format.sampleRate)
  }

  private static func readUInt16(_ data: Data, at offset: Int) -> UInt16 { UInt16(data[offset]) | UInt16(data[offset + 1]) << 8 }
  private static func readUInt32(_ data: Data, at offset: Int) -> UInt32 { UInt32(readUInt16(data, at: offset)) | UInt32(readUInt16(data, at: offset + 2)) << 16 }
}

private func csvEscape(_ value: String) -> String { "\"\(value.replacingOccurrences(of: "\"", with: "\"\""))\"" }
private func formatted(_ value: Double) -> String { String(format: "%.6f", value) }
private func formatted(_ value: Float) -> String { String(format: "%.8f", value) }

private struct RegressionComparison {
  let expectedCount: Int
  let matchedCount: Int
  let falsePositiveCount: Int
  let falseNegativeCount: Int
  let meanAbsoluteErrorMs: Double
  let maximumAbsoluteErrorMs: Double
}

private func normalizedStem(_ value: String) -> String {
  value.lowercased().filter { $0.isLetter || $0.isNumber }
}

private func expectedOnsets(for recording: URL, in assets: URL) throws -> [Double]? {
  let stem = recording.deletingPathExtension().lastPathComponent
  let recordingKey = normalizedStem(stem)
  let expectedURLs = try FileManager.default.contentsOfDirectory(at: assets, includingPropertiesForKeys: nil).filter {
    let csvStem = $0.deletingPathExtension().lastPathComponent
    guard csvStem.hasSuffix("_onsets") else { return false }
    return normalizedStem(String(csvStem.dropLast("_onsets".count))) == recordingKey
  }
  guard expectedURLs.count <= 1 else { throw DiagnosticError.message("Multiple baseline CSVs match \(recording.lastPathComponent)") }
  guard let expectedURL = expectedURLs.first else { return nil }
  let lines = try String(contentsOf: expectedURL, encoding: .utf8).split(whereSeparator: \.isNewline)
  guard let header = lines.first else { throw DiagnosticError.message("Empty baseline CSV: \(expectedURL.lastPathComponent)") }
  let columns = header.split(separator: ",").map(String.init)
  guard let timestampColumn = columns.firstIndex(of: "timestamp_s") else { throw DiagnosticError.message("Missing timestamp_s in \(expectedURL.lastPathComponent)") }
  return try lines.dropFirst().map { line in
    let values = line.split(separator: ",", omittingEmptySubsequences: false)
    guard values.count > timestampColumn, let timestamp = Double(values[timestampColumn]) else { throw DiagnosticError.message("Invalid timestamp in \(expectedURL.lastPathComponent)") }
    return timestamp
  }
}

private func compare(detected: [OnsetEvent], expected: [Double], toleranceSeconds: Double = 0.025) -> RegressionComparison {
  var unmatchedExpected = Set(expected.indices)
  var errors: [Double] = []
  for event in detected {
    guard let match = unmatchedExpected.min(by: { abs(expected[$0] - event.timestampSeconds) < abs(expected[$1] - event.timestampSeconds) }), abs(expected[match] - event.timestampSeconds) <= toleranceSeconds else { continue }
    unmatchedExpected.remove(match)
    errors.append(abs(expected[match] - event.timestampSeconds) * 1_000)
  }
  return RegressionComparison(expectedCount: expected.count, matchedCount: errors.count, falsePositiveCount: detected.count - errors.count, falseNegativeCount: unmatchedExpected.count, meanAbsoluteErrorMs: errors.isEmpty ? 0 : errors.reduce(0, +) / Double(errors.count), maximumAbsoluteErrorMs: errors.max() ?? 0)
}

private func writeRecordingArtifacts(audio: DecodedAudio, name: String, output: URL, configuration: SpectralFluxConfiguration) throws -> [OnsetEvent] {
  guard let detector = SpectralFluxDetector(sampleRate: audio.sampleRate, configuration: configuration) else { throw DiagnosticError.message("Could not initialize detector for \(name)") }
  var analysis: [SpectralFluxAnalysisFrame] = []
  detector.onAnalysisFrame = { analysis.append($0) }
  let started = DispatchTime.now().uptimeNanoseconds
  var events: [OnsetEvent] = []
  var offset = 0
  let blocks = [89, 257, 511, 1_024]
  var blockIndex = 0
  while offset < audio.samples.count {
    let count = min(blocks[blockIndex % blocks.count], audio.samples.count - offset)
    events.append(contentsOf: detector.process(samples: Array(audio.samples[offset ..< offset + count])))
    offset += count; blockIndex += 1
  }
  events.append(contentsOf: detector.finish())
  let elapsed = Double(DispatchTime.now().uptimeNanoseconds - started) / 1_000_000_000
  let stem = URL(fileURLWithPath: name).deletingPathExtension().lastPathComponent
  let traceURL = output.appendingPathComponent("\(stem)-spectral-flux.csv")
  let trace = (["sample_index,timestamp_seconds,spectral_flux,adaptive_threshold"] + analysis.map {
    "\($0.sampleIndex),\(formatted(Double($0.sampleIndex) / audio.sampleRate)),\(formatted($0.spectralFlux)),\(formatted($0.adaptiveThreshold))"
  }).joined(separator: "\n") + "\n"
  try trace.write(to: traceURL, atomically: true, encoding: .utf8)
  let waveformURL = output.appendingPathComponent("\(stem)-waveform.csv")
  let waveformStride = max(1, Int(audio.sampleRate / 1_000))
  let waveform = (["sample_index,timestamp_seconds,amplitude"] + Swift.stride(from: 0, to: audio.samples.count, by: waveformStride).map {
    "\($0),\(formatted(Double($0) / audio.sampleRate)),\(formatted(audio.samples[$0]))"
  }).joined(separator: "\n") + "\n"
  try waveform.write(to: waveformURL, atomically: true, encoding: .utf8)
  let duration = Double(audio.samples.count) / audio.sampleRate
  print(name)
  print("  duration: \(String(format: "%.2f", duration)) s")
  print("  sample rate: \(String(format: "%.0f", audio.sampleRate)) Hz")
  print("  events: \(events.count)")
  print("  timestamps:")
  for event in events { print("    \(String(format: "%.3f", event.timestampSeconds))") }
  print("  processing: \(String(format: "%.3f", elapsed)) s (\(String(format: "%.1f", duration / max(elapsed, 0.000_001)))x real time, \(String(format: "%.3f", elapsed * 1_000 / Double(max(analysis.count, 1)))) ms/hop)")
  return events
}

private func runDiagnostic() throws {
  let arguments = Array(CommandLine.arguments.dropFirst())
  guard arguments.count == 2 else { throw DiagnosticError.message("Usage: diagnose-piano-attack-detector.swift <assets-directory> <output-directory>") }
  let assets = URL(fileURLWithPath: arguments[0], isDirectory: true)
  let output = URL(fileURLWithPath: arguments[1], isDirectory: true)
  try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
  let recordings = try FileManager.default.contentsOfDirectory(at: assets, includingPropertiesForKeys: nil).filter { $0.pathExtension.lowercased() == "wav" }.sorted { $0.lastPathComponent < $1.lastPathComponent }
  guard !recordings.isEmpty else { throw DiagnosticError.message("No WAV files in \(assets.path)") }
  let environment = ProcessInfo.processInfo.environment
  var options: [String: Double] = [:]
  if let value = environment["MUSEBUDDY_SPECTRAL_FLUX_MINIMUM_THRESHOLD_RATIO"].flatMap(Double.init) { options["minimumThresholdRatio"] = value }
  if let value = environment["MUSEBUDDY_SPECTRAL_FLUX_MINIMUM_PROMINENCE"].flatMap(Double.init) { options["minimumProminence"] = value }
  if let value = environment["MUSEBUDDY_SPECTRAL_FLUX_MINIMUM_FLUX"].flatMap(Double.init) { options["minimumFlux"] = value }
  if let value = environment["MUSEBUDDY_SPECTRAL_FLUX_MINIMUM_RMS_RISE_DB"].flatMap(Double.init) { options["minimumRmsRiseDb"] = value }
  if let value = environment["MUSEBUDDY_SPECTRAL_FLUX_COOLDOWN_MS"].flatMap(Double.init) { options["cooldownMs"] = value }
  let configuration = SpectralFluxConfiguration(options: options)
  print("Spectral-flux configuration: confidence \(configuration.minimumThresholdRatio), prominence \(configuration.minimumProminence), RMS rise \(configuration.minimumRmsRiseDb) dB, cooldown \(configuration.cooldownMs) ms")
  var resultRows = ["filename,event_index,sample_index,timestamp_seconds,spectral_flux,adaptive_threshold,prominence,confidence,frame_rms_dbfs"]
  for recording in recordings {
    let audio = try WavFileDecoder.decode(url: recording)
    let events = try writeRecordingArtifacts(audio: audio, name: recording.lastPathComponent, output: output, configuration: configuration)
    if let expected = try expectedOnsets(for: recording, in: assets) {
      let comparison = compare(detected: events, expected: expected)
      let status = comparison.falsePositiveCount == 0 && comparison.falseNegativeCount == 0 ? "PASS" : "FAIL"
      print("  expected events: \(comparison.expectedCount)")
      print("  matched events: \(comparison.matchedCount)")
      print("  false positives: \(comparison.falsePositiveCount)")
      print("  false negatives: \(comparison.falseNegativeCount)")
      print("  mean absolute timestamp error: \(String(format: "%.2f", comparison.meanAbsoluteErrorMs)) ms")
      print("  maximum absolute timestamp error: \(String(format: "%.2f", comparison.maximumAbsoluteErrorMs)) ms")
      print("  regression: \(status)")
    } else { print("  baseline: unlabelled (no matching CSV)") }
    for (index, event) in events.enumerated() {
      resultRows.append("\(csvEscape(recording.lastPathComponent)),\(index + 1),\(event.sampleIndex),\(formatted(event.timestampSeconds)),\(formatted(event.spectralFlux)),\(formatted(event.adaptiveThreshold)),\(formatted(event.prominence)),\(formatted(event.confidence)),\(formatted(event.frameRmsDbfs))")
    }
  }
  try (resultRows.joined(separator: "\n") + "\n").write(to: output.appendingPathComponent("spectral-flux-events.csv"), atomically: true, encoding: .utf8)
  print("\nMachine-readable results: \(output.appendingPathComponent("spectral-flux-events.csv").path)")
}

@main struct PianoAttackDetectorDiagnostic {
  static func main() {
    do {
      try runSpectralFluxDetectorTests()
      try runDiagnostic()
    } catch {
      FileHandle.standardError.write(Data("FAIL: \(error)\n".utf8))
      Foundation.exit(1)
    }
  }
}
