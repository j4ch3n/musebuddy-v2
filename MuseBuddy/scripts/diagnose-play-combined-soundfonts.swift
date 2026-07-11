import AudioToolbox
import AVFoundation
import Foundation

private struct SoundFontPreset {
  let bank: UInt16
  let name: String
  let program: UInt8
}

private struct SamplerPreset {
  let bankLSB: UInt8
  let bankMSB: UInt8
  let label: String
  let program: UInt8
}

private enum DiagnosticError: LocalizedError {
  case invalidSoundFont(String)
  case samplerComponentUnavailable

  var errorDescription: String? {
    switch self {
    case let .invalidSoundFont(detail):
      "Invalid SoundFont: \(detail)"
    case .samplerComponentUnavailable:
      "AVAudioUnitSampler is unavailable in this process. Run the diagnostic outside the sandbox."
    }
  }
}

private let arguments = CommandLine.arguments.dropFirst()
private let melodicSoundFontURL = URL(
  fileURLWithPath: arguments.first ?? "assets/audio/piano-yamaha-PSRF50.sf2"
)
private let percussionSoundFontURL = URL(
  fileURLWithPath: arguments.dropFirst().first ?? "assets/audio/jazz-percussion.sf2"
)

do {
  guard isSamplerComponentAvailable() else {
    throw DiagnosticError.samplerComponentUnavailable
  }

  let melodicPreset = try firstPreset(
    in: melodicSoundFontURL,
    labelPrefix: "melodic"
  )
  let percussionPreset = try firstPreset(
    in: percussionSoundFontURL,
    labelPrefix: "percussion"
  )

  print("Melodic SoundFont: \(melodicSoundFontURL.path)")
  print(
    "Melodic preset: \(melodicPreset.label) program=\(melodicPreset.program) "
      + "bankMSB=\(melodicPreset.bankMSB) bankLSB=\(melodicPreset.bankLSB)"
  )
  print("Percussion SoundFont: \(percussionSoundFontURL.path)")
  print(
    "Percussion preset: \(percussionPreset.label) program=\(percussionPreset.program) "
      + "bankMSB=\(percussionPreset.bankMSB) bankLSB=\(percussionPreset.bankLSB)"
  )

  try playCombinedDiagnostic(
    melodicPreset: melodicPreset,
    melodicSoundFontURL: melodicSoundFontURL,
    percussionPreset: percussionPreset,
    percussionSoundFontURL: percussionSoundFontURL
  )

  print("Loaded and played melodic plus percussion SoundFonts together.")
} catch {
  fputs("diagnose:play-combined-soundfonts failed: \(error.localizedDescription)\n", stderr)
  exit(1)
}

private func firstPreset(in url: URL, labelPrefix: String) throws -> SamplerPreset {
  let presets = try parseSoundFontPresets(at: url)
  guard let preset = presets.first else {
    throw DiagnosticError.invalidSoundFont("No playable presets were found.")
  }

  return SamplerPreset(
    bankLSB: 0,
    bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB),
    label: "\(labelPrefix) \(preset.name) custom SF2 bank",
    program: preset.program
  )
}

private func playCombinedDiagnostic(
  melodicPreset: SamplerPreset,
  melodicSoundFontURL: URL,
  percussionPreset: SamplerPreset,
  percussionSoundFontURL: URL
) throws {
  let engine = AVAudioEngine()
  let melodicSampler = AVAudioUnitSampler()
  let percussionSampler = AVAudioUnitSampler()
  let sequencer = AVAudioSequencer(audioEngine: engine)

  engine.attach(melodicSampler)
  engine.attach(percussionSampler)
  engine.connect(melodicSampler, to: engine.mainMixerNode, format: nil)
  engine.connect(percussionSampler, to: engine.mainMixerNode, format: nil)
  engine.prepare()
  try engine.start()
  defer {
    sequencer.stop()
    silence(melodicSampler)
    silence(percussionSampler)
    engine.stop()
  }

  try melodicSampler.loadSoundBankInstrument(
    at: melodicSoundFontURL,
    program: melodicPreset.program,
    bankMSB: melodicPreset.bankMSB,
    bankLSB: melodicPreset.bankLSB
  )
  try percussionSampler.loadSoundBankInstrument(
    at: percussionSoundFontURL,
    program: percussionPreset.program,
    bankMSB: percussionPreset.bankMSB,
    bankLSB: percussionPreset.bankLSB
  )

  sequencer.tempoTrack.addEvent(AVExtendedTempoEvent(tempo: 120), at: 0)
  appendLeadInTrack(to: sequencer, sampler: percussionSampler)
  appendMelodicTrack(to: sequencer, sampler: melodicSampler)

  sequencer.prepareToPlay()
  sequencer.currentPositionInBeats = 0
  try sequencer.start()
  Thread.sleep(forTimeInterval: 2.2)
}

private func appendLeadInTrack(to sequencer: AVAudioSequencer, sampler: AVAudioUnitSampler) {
  let track = sequencer.createAndAppendTrack()
  track.destinationAudioUnit = sampler

  for beatIndex in 0 ..< 4 {
    let event = AVMIDINoteEvent(
      channel: 9,
      key: 43,
      velocity: 112,
      duration: 0.18
    )
    track.addEvent(event, at: Double(beatIndex) * 0.5)
  }
}

private func appendMelodicTrack(to sequencer: AVAudioSequencer, sampler: AVAudioUnitSampler) {
  let track = sequencer.createAndAppendTrack()
  track.destinationAudioUnit = sampler

  let notes: [(beat: Double, midi: UInt32)] = [
    (0.0, 60),
    (0.5, 64),
    (1.0, 67),
    (1.5, 72),
  ]

  for note in notes {
    let event = AVMIDINoteEvent(
      channel: 0,
      key: note.midi,
      velocity: 90,
      duration: 0.35
    )
    track.addEvent(event, at: note.beat)
  }
}

private func silence(_ sampler: AVAudioUnitSampler) {
  for channel in UInt8(0) ... UInt8(15) {
    sampler.sendController(120, withValue: 0, onChannel: channel)
    sampler.sendController(123, withValue: 0, onChannel: channel)
  }
}

private func parseSoundFontPresets(at url: URL) throws -> [SoundFontPreset] {
  let data = try Data(contentsOf: url)
  guard data.count >= 12 else {
    throw DiagnosticError.invalidSoundFont("File is too small.")
  }
  guard data.asciiString(in: 0 ..< 4) == "RIFF", data.asciiString(in: 8 ..< 12) == "sfbk" else {
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
    let name = data.nullTerminatedASCIIString(in: offset ..< (offset + 20))
    let program = data.uint16LittleEndian(at: offset + 20)
    let bank = data.uint16LittleEndian(at: offset + 22)
    offset += recordSize

    guard name != "EOP", program <= UInt16(UInt8.max) else {
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
    let name = data.asciiString(in: offset ..< (offset + 4))
    let size = Int(data.uint32LittleEndian(at: offset + 4))
    let payloadStart = offset + 8
    let payloadEnd = payloadStart + size
    guard payloadEnd <= data.count else {
      return nil
    }

    if name == chunkName {
      return payloadStart ..< payloadEnd
    }

    if name == "LIST", payloadStart + 4 <= payloadEnd {
      var childOffset = payloadStart + 4
      while childOffset + 8 <= payloadEnd {
        let childName = data.asciiString(in: childOffset ..< (childOffset + 4))
        let childSize = Int(data.uint32LittleEndian(at: childOffset + 4))
        let childPayloadStart = childOffset + 8
        let childPayloadEnd = childPayloadStart + childSize
        guard childPayloadEnd <= payloadEnd else {
          return nil
        }

        if childName == chunkName {
          return childPayloadStart ..< childPayloadEnd
        }

        childOffset = childPayloadEnd + (childSize % 2)
      }
    }

    offset = payloadEnd + (size % 2)
  }

  return nil
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
    return String(decoding: self[range.lowerBound ..< endIndex], as: UTF8.self)
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
