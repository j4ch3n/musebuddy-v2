import AudioToolbox
import AVFoundation
import Foundation

private struct PlaybackConfiguration: Decodable {
  let instrument: String
  let notes: [PlaybackNote]
}

private struct PlaybackNote: Decodable {
  let channel: UInt8
  let durationSeconds: TimeInterval
  let id: String
  let midi: UInt8
  let startTimeSeconds: TimeInterval
  let velocity: UInt8
}

private struct SoundFontPreset {
  let bank: UInt16
  let name: String
  let program: UInt8
}

private struct SamplerPresetCandidate {
  let bankLSB: UInt8
  let bankMSB: UInt8
  let label: String
  let program: UInt8
}

private enum DiagnosticError: LocalizedError {
  case invalidSoundFont(String)
  case invalidConfiguration(String)
  case samplerComponentUnavailable
  case noLoadablePreset([String])

  var errorDescription: String? {
    switch self {
    case let .invalidSoundFont(detail):
      "Invalid SoundFont: \(detail)"
    case let .invalidConfiguration(detail):
      "Invalid playback configuration: \(detail)"
    case .samplerComponentUnavailable:
      "AVAudioUnitSampler is unavailable in this process. Run the diagnostic outside the sandbox."
    case let .noLoadablePreset(errors):
      "No SoundFont preset could be loaded.\n\(errors.joined(separator: "\n"))"
    }
  }
}

private let defaultSoundFontPath = "assets/audio/piano-yamaha-PSRF50.sf2"
private let defaultConfigurationPath = "scripts/diagnose-play-soundfont.config.json"

private let arguments = CommandLine.arguments.dropFirst()
private let soundFontURL = URL(fileURLWithPath: arguments.first ?? defaultSoundFontPath)
private let configurationURL = URL(fileURLWithPath: arguments.dropFirst().first ?? defaultConfigurationPath)

do {
  let configuration = try loadConfiguration(at: configurationURL)
  let presets = try parseSoundFontPresets(at: soundFontURL)
  let candidates = buildSamplerCandidates(from: presets)

  print("SoundFont: \(soundFontURL.path)")
  print("Config: \(configurationURL.path)")
  print("Discovered presets:")
  for preset in presets {
    print("  - \(preset.name) program=\(preset.program) bank=\(preset.bank)")
  }

  let loadedCandidate = try loadFirstWorkingCandidate(
    candidates,
    configuration: configuration,
    soundFontURL: soundFontURL
  )

  print(
    "Loaded SoundFont preset: \(loadedCandidate.label) program=\(loadedCandidate.program) "
      + "bankMSB=\(loadedCandidate.bankMSB) bankLSB=\(loadedCandidate.bankLSB)"
  )
} catch {
  fputs("diagnose:play-soundfont failed: \(error.localizedDescription)\n", stderr)
  exit(1)
}

private func loadConfiguration(at url: URL) throws -> PlaybackConfiguration {
  let configuration = try JSONDecoder().decode(PlaybackConfiguration.self, from: Data(contentsOf: url))

  guard configuration.instrument == "piano" else {
    throw DiagnosticError.invalidConfiguration("Only the piano instrument is supported.")
  }
  guard !configuration.notes.isEmpty else {
    throw DiagnosticError.invalidConfiguration("At least one note is required.")
  }

  for note in configuration.notes {
    guard note.durationSeconds.isFinite, note.durationSeconds > 0 else {
      throw DiagnosticError.invalidConfiguration("Note \(note.id) has an invalid duration.")
    }
    guard note.startTimeSeconds.isFinite, note.startTimeSeconds >= 0 else {
      throw DiagnosticError.invalidConfiguration("Note \(note.id) has an invalid start time.")
    }
    guard (1 ... 127).contains(note.midi) else {
      throw DiagnosticError.invalidConfiguration("Note \(note.id) has an invalid MIDI value.")
    }
    guard (0 ... 127).contains(note.velocity) else {
      throw DiagnosticError.invalidConfiguration("Note \(note.id) has an invalid velocity.")
    }
    guard (0 ... 15).contains(note.channel) else {
      throw DiagnosticError.invalidConfiguration("Note \(note.id) has an invalid channel.")
    }
  }

  return configuration
}

private func parseSoundFontPresets(at url: URL) throws -> [SoundFontPreset] {
  let data = try Data(contentsOf: url)
  guard data.count >= 12 else {
    throw DiagnosticError.invalidSoundFont("File is too small.")
  }
  guard data.asciiString(in: 0..<4) == "RIFF", data.asciiString(in: 8..<12) == "sfbk" else {
    throw DiagnosticError.invalidSoundFont("Expected RIFF sfbk header.")
  }

  guard let phdrRange = findChunk(named: "phdr", in: data) else {
    throw DiagnosticError.invalidSoundFont("Missing preset header chunk.")
  }

  let recordSize = 38
  guard phdrRange.count >= recordSize * 2, phdrRange.count.isMultiple(of: recordSize) else {
    throw DiagnosticError.invalidSoundFont("Preset header chunk has an unexpected size.")
  }

  var presets: [SoundFontPreset] = []
  var offset = phdrRange.lowerBound
  while offset + recordSize <= phdrRange.upperBound {
    let name = data.nullTerminatedASCIIString(in: offset..<(offset + 20))
    let program = data.uint16LittleEndian(at: offset + 20)
    let bank = data.uint16LittleEndian(at: offset + 22)
    offset += recordSize

    guard name != "EOP" else {
      continue
    }
    guard program <= UInt16(UInt8.max) else {
      continue
    }

    presets.append(SoundFontPreset(bank: bank, name: name, program: UInt8(program)))
  }

  guard !presets.isEmpty else {
    throw DiagnosticError.invalidSoundFont("No playable presets were found.")
  }

  return presets
}

private func findChunk(named chunkName: String, in data: Data) -> Range<Int>? {
  var offset = 12
  while offset + 8 <= data.count {
    let name = data.asciiString(in: offset..<(offset + 4))
    let size = Int(data.uint32LittleEndian(at: offset + 4))
    let payloadStart = offset + 8
    let payloadEnd = payloadStart + size
    guard payloadEnd <= data.count else {
      return nil
    }

    if name == chunkName {
      return payloadStart..<payloadEnd
    }

    if name == "LIST", payloadStart + 4 <= payloadEnd {
      var childOffset = payloadStart + 4
      while childOffset + 8 <= payloadEnd {
        let childName = data.asciiString(in: childOffset..<(childOffset + 4))
        let childSize = Int(data.uint32LittleEndian(at: childOffset + 4))
        let childPayloadStart = childOffset + 8
        let childPayloadEnd = childPayloadStart + childSize
        guard childPayloadEnd <= payloadEnd else {
          return nil
        }

        if childName == chunkName {
          return childPayloadStart..<childPayloadEnd
        }

        childOffset = childPayloadEnd + (childSize % 2)
      }
    }

    offset = payloadEnd + (size % 2)
  }

  return nil
}

private func buildSamplerCandidates(from presets: [SoundFontPreset]) -> [SamplerPresetCandidate] {
  var candidates: [SamplerPresetCandidate] = []
  for preset in presets {
    let splitBankMSB = UInt8((preset.bank >> 7) & 0x7F)
    let splitBankLSB = UInt8(preset.bank & 0x7F)
    let rawBank = UInt8(truncatingIfNeeded: preset.bank)

    appendUnique(
      SamplerPresetCandidate(
        bankLSB: splitBankLSB,
        bankMSB: splitBankMSB,
        label: "\(preset.name) SF2 bank split",
        program: preset.program
      ),
      to: &candidates
    )
    appendUnique(
      SamplerPresetCandidate(
        bankLSB: rawBank,
        bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB),
        label: "\(preset.name) Apple melodic bank",
        program: preset.program
      ),
      to: &candidates
    )
  }

  return candidates
}

private func appendUnique(_ candidate: SamplerPresetCandidate, to candidates: inout [SamplerPresetCandidate]) {
  guard !candidates.contains(where: {
    $0.program == candidate.program
      && $0.bankMSB == candidate.bankMSB
      && $0.bankLSB == candidate.bankLSB
  }) else {
    return
  }

  candidates.append(candidate)
}

private func loadFirstWorkingCandidate(
  _ candidates: [SamplerPresetCandidate],
  configuration: PlaybackConfiguration,
  soundFontURL: URL
) throws -> SamplerPresetCandidate {
  var errors: [String] = []

  for candidate in candidates {
    do {
      try playDiagnosticNotes(
        configuration: configuration,
        preset: candidate,
        soundFontURL: soundFontURL
      )
      return candidate
    } catch {
      errors.append(
        "- \(candidate.label) program=\(candidate.program) bankMSB=\(candidate.bankMSB) "
          + "bankLSB=\(candidate.bankLSB): \(error.localizedDescription)"
      )
    }
  }

  throw DiagnosticError.noLoadablePreset(errors)
}

private func playDiagnosticNotes(
  configuration: PlaybackConfiguration,
  preset: SamplerPresetCandidate,
  soundFontURL: URL
) throws {
  guard isSamplerComponentAvailable() else {
    throw DiagnosticError.samplerComponentUnavailable
  }

  let engine = AVAudioEngine()
  let sampler = AVAudioUnitSampler()
  let sequencer = AVAudioSequencer(audioEngine: engine)

  engine.attach(sampler)
  engine.connect(sampler, to: engine.mainMixerNode, format: nil)
  engine.prepare()
  try engine.start()
  defer {
    sequencer.stop()
    for channel in UInt8(0) ... UInt8(15) {
      sampler.sendController(120, withValue: 0, onChannel: channel)
      sampler.sendController(123, withValue: 0, onChannel: channel)
    }
    engine.stop()
  }

  try sampler.loadSoundBankInstrument(
    at: soundFontURL,
    program: preset.program,
    bankMSB: preset.bankMSB,
    bankLSB: preset.bankLSB
  )

  sequencer.tempoTrack.addEvent(AVExtendedTempoEvent(tempo: 60), at: 0)
  let track = sequencer.createAndAppendTrack()
  track.destinationAudioUnit = sampler

  for note in configuration.notes {
    let event = AVMIDINoteEvent(
      channel: UInt32(note.channel),
      key: UInt32(note.midi),
      velocity: UInt32(note.velocity),
      duration: note.durationSeconds
    )
    track.addEvent(event, at: note.startTimeSeconds)
  }

  sequencer.prepareToPlay()
  sequencer.currentPositionInBeats = 0
  try sequencer.start()

  let playbackLength = configuration.notes.reduce(TimeInterval(0)) {
    max($0, $1.startTimeSeconds + $1.durationSeconds)
  }
  Thread.sleep(forTimeInterval: playbackLength + 0.1)
}

private func isSamplerComponentAvailable() -> Bool {
  var description = AudioComponentDescription(
    componentType: kAudioUnitType_MusicDevice,
    componentSubType: kAudioUnitSubType_Sampler,
    componentManufacturer: kAudioUnitManufacturer_Apple,
    componentFlags: 0,
    componentFlagsMask: 0
  )
  return AudioComponentFindNext(nil, &description) != nil
}

private extension Data {
  func asciiString(in range: Range<Int>) -> String {
    String(decoding: self[range], as: UTF8.self)
  }

  func nullTerminatedASCIIString(in range: Range<Int>) -> String {
    let bytes = self[range]
    let endIndex = bytes.firstIndex(of: 0) ?? range.upperBound
    return String(decoding: self[range.lowerBound..<endIndex], as: UTF8.self)
      .trimmingCharacters(in: .whitespacesAndNewlines)
  }

  func uint16LittleEndian(at offset: Int) -> UInt16 {
    UInt16(self[offset]) | (UInt16(self[offset + 1]) << 8)
  }

  func uint32LittleEndian(at offset: Int) -> UInt32 {
    UInt32(self[offset])
      | (UInt32(self[offset + 1]) << 8)
      | (UInt32(self[offset + 2]) << 16)
      | (UInt32(self[offset + 3]) << 24)
  }
}
