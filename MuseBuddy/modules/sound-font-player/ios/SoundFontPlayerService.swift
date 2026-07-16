import AudioToolbox
import AVFoundation
import Foundation

final class SoundFontPlayerService: @unchecked Sendable {
  struct PlaybackStartResult {
    let playbackId: Int
    let startedAtMs: Double
  }

  private enum InstrumentRole: Hashable {
    case groove
    case leadIn
    case piano
  }

  private struct InstrumentDefinition {
    let bankLSB: UInt8
    let bankMSB: UInt8
    let midiChannel: UInt8
    let program: UInt8
    let resourceName: String
  }

  private struct ActiveNote {
    let midi: UInt8
    let startStepIndex: Int
    let velocity: UInt8
  }

  private struct ScheduledNote {
    let durationBeats: Double
    let midi: UInt8
    let startBeat: Double
    let velocity: UInt8
  }

  private struct PlaybackMaterial {
    let lengthBeats: Double
    let notes: [ScheduledNote]
  }

  private static let stepsPerPart = 16
  private static let maximumPartCount = 8
  private static let stepDurationBeats = 0.25
  private static let leadInBeatCount = 4
  private static let leadInDurationBeats = 4.0
  private static let holdMidi = -50
  private static let readinessPollSeconds = 0.01
  private static let readinessTimeoutSeconds = 3.0
  private static let leadInMidiNote: UInt8 = 43

  private static let pianoInstrument = InstrumentDefinition(
    bankLSB: UInt8(kAUSampler_DefaultBankLSB),
    bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB),
    midiChannel: 0,
    program: 0,
    resourceName: "piano-white-grand"
  )
  private static let grooveInstrument = InstrumentDefinition(
    bankLSB: UInt8(kAUSampler_DefaultBankLSB),
    bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB),
    midiChannel: 3,
    program: 0,
    resourceName: "jazz-percussion"
  )
  private static let leadInInstrument = InstrumentDefinition(
    bankLSB: UInt8(kAUSampler_DefaultBankLSB),
    bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB),
    midiChannel: 8,
    program: 0,
    resourceName: "jazz-percussion"
  )

  private let workQueue = DispatchQueue(
    label: "com.musebuddy.sound-font-player",
    qos: .userInitiated
  )
  private var audioEngine: AVAudioEngine?
  private var finishWorkItem: DispatchWorkItem?
  private var playbackId = 0
  private var activePlaybackId: Int?
  private var samplers: [InstrumentRole: AVAudioUnitSampler] = [:]
  private var sequencer: AVAudioSequencer?

  var onPlaybackFinish: (([String: Any]) -> Void)?

  func playPiano(
    configuration: SoundFontPlaybackConfigurationRecord,
    options: SoundFontPlaybackOptionsRecord
  ) async throws -> PlaybackStartResult {
    try await play(configuration: configuration, options: options, role: .piano)
  }

  func playGroove(
    configuration: SoundFontPlaybackConfigurationRecord,
    options: SoundFontPlaybackOptionsRecord
  ) async throws -> PlaybackStartResult {
    try await play(configuration: configuration, options: options, role: .groove)
  }

  func stop(playbackId: Int) async {
    await withCheckedContinuation { continuation in
      workQueue.async {
        if self.activePlaybackId == playbackId {
          self.disposePlayback(deactivateAudioSession: true)
        }
        continuation.resume()
      }
    }
  }

  func dispose() {
    workQueue.async {
      self.disposePlayback(deactivateAudioSession: true)
    }
  }

  private func play(
    configuration: SoundFontPlaybackConfigurationRecord,
    options: SoundFontPlaybackOptionsRecord,
    role: InstrumentRole
  ) async throws -> PlaybackStartResult {
    try await withCheckedThrowingContinuation { continuation in
      workQueue.async {
        do {
          try continuation.resume(
            returning: self.startPlayback(
              configuration: configuration,
              options: options,
              role: role
            )
          )
        } catch {
          continuation.resume(throwing: error)
        }
      }
    }
  }

  private func startPlayback(
    configuration: SoundFontPlaybackConfigurationRecord,
    options: SoundFontPlaybackOptionsRecord,
    role: InstrumentRole
  ) throws -> PlaybackStartResult {
    disposePlayback(deactivateAudioSession: true)

    guard configuration.bpm.isFinite, configuration.bpm > 0 else {
      throw SoundFontPlayerError.invalidConfiguration("BPM must be positive.")
    }
    let material = try Self.validatedMaterial(from: configuration.parts)
    guard !material.notes.isEmpty else {
      throw SoundFontPlayerError.emptyConfiguration
    }

    let engine = AVAudioEngine()
    do {
      let primarySampler = try makeSampler(for: role, engine: engine)
      var nextSamplers: [InstrumentRole: AVAudioUnitSampler] = [role: primarySampler]
      if options.leadIn {
        nextSamplers[.leadIn] = try makeSampler(for: .leadIn, engine: engine)
      }

      try activateAudioSession()
      engine.prepare()
      try engine.start()
      try waitForOutputRendering(engine: engine)

      let nextSequencer = try makeSequencer(
        engine: engine,
        material: material,
        bpm: configuration.bpm,
        options: options,
        primaryRole: role,
        samplers: nextSamplers
      )
      nextSequencer.prepareToPlay()
      nextSequencer.currentPositionInBeats = 0
      try nextSequencer.start()
      let startedAtMs = Self.currentTimeMs()

      playbackId += 1
      let nextPlaybackId = playbackId
      audioEngine = engine
      samplers = nextSamplers
      sequencer = nextSequencer
      activePlaybackId = nextPlaybackId

      let secondsPerBeat = 60 / configuration.bpm
      let leadInSeconds = options.leadIn
        ? Double(Self.leadInBeatCount) * secondsPerBeat
        : 0
      let repetitions = max(1, options.repetitions)
      scheduleFinish(
        playbackId: nextPlaybackId,
        delay: leadInSeconds + material.lengthBeats * Double(repetitions) * secondsPerBeat
      )

      return PlaybackStartResult(playbackId: nextPlaybackId, startedAtMs: startedAtMs)
    } catch let error as SoundFontPlayerError {
      disposeGraph(engine: engine)
      deactivateAudioSession()
      throw error
    } catch {
      disposeGraph(engine: engine)
      deactivateAudioSession()
      throw SoundFontPlayerError.engineStartFailed(error.localizedDescription)
    }
  }

  private func makeSampler(
    for role: InstrumentRole,
    engine: AVAudioEngine
  ) throws -> AVAudioUnitSampler {
    let definition = Self.definition(for: role)
    guard let soundFontURL = findSoundFontURL(resourceName: definition.resourceName) else {
      throw SoundFontPlayerError.resourceMissing
    }

    let sampler = AVAudioUnitSampler()
    engine.attach(sampler)
    engine.connect(sampler, to: engine.mainMixerNode, format: nil)
    do {
      try sampler.loadSoundBankInstrument(
        at: soundFontURL,
        program: definition.program,
        bankMSB: definition.bankMSB,
        bankLSB: definition.bankLSB
      )
      sampler.sendProgramChange(
        definition.program,
        bankMSB: definition.bankMSB,
        bankLSB: definition.bankLSB,
        onChannel: definition.midiChannel
      )
      return sampler
    } catch {
      throw SoundFontPlayerError.loadFailed(
        "\(definition.resourceName).sf2: \(error.localizedDescription)"
      )
    }
  }

  // swiftlint:disable:next function_parameter_count
  private func makeSequencer(
    engine: AVAudioEngine,
    material: PlaybackMaterial,
    bpm: Double,
    options: SoundFontPlaybackOptionsRecord,
    primaryRole: InstrumentRole,
    samplers: [InstrumentRole: AVAudioUnitSampler]
  ) throws -> AVAudioSequencer {
    guard let primarySampler = samplers[primaryRole] else {
      throw SoundFontPlayerError.invalidConfiguration("The requested sampler is unavailable.")
    }

    let nextSequencer = AVAudioSequencer(audioEngine: engine)
    let tempoTrack = nextSequencer.tempoTrack
    tempoTrack.addEvent(AVExtendedTempoEvent(tempo: bpm), at: 0)
    let startBeat = options.leadIn ? Self.leadInDurationBeats : 0
    let repetitions = max(1, options.repetitions)
    let primaryDefinition = Self.definition(for: primaryRole)
    let track = nextSequencer.createAndAppendTrack()
    track.destinationAudioUnit = primarySampler

    for repetition in 0 ..< repetitions {
      let repetitionStart = startBeat + Double(repetition) * material.lengthBeats
      for note in material.notes {
        let event = AVMIDINoteEvent(
          channel: UInt32(primaryDefinition.midiChannel),
          key: UInt32(note.midi),
          velocity: UInt32(note.velocity),
          duration: note.durationBeats
        )
        track.addEvent(event, at: repetitionStart + note.startBeat)
      }
    }

    if options.leadIn {
      try appendLeadIn(to: nextSequencer, samplers: samplers)
    }
    return nextSequencer
  }

  private func appendLeadIn(
    to sequencer: AVAudioSequencer,
    samplers: [InstrumentRole: AVAudioUnitSampler]
  ) throws {
    guard let sampler = samplers[.leadIn] else {
      throw SoundFontPlayerError.invalidConfiguration("The lead-in sampler is unavailable.")
    }
    let track = sequencer.createAndAppendTrack()
    track.destinationAudioUnit = sampler
    for beat in 0 ..< Self.leadInBeatCount {
      track.addEvent(
        AVMIDINoteEvent(
          channel: UInt32(Self.leadInInstrument.midiChannel),
          key: UInt32(Self.leadInMidiNote),
          velocity: 112,
          duration: 0.2
        ),
        at: Double(beat)
      )
    }
  }

  private func activateAudioSession() throws {
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
      try session.setActive(true)
    } catch {
      throw SoundFontPlayerError.engineStartFailed(error.localizedDescription)
    }
  }

  private func waitForOutputRendering(engine: AVAudioEngine) throws {
    let deadline = Date().addingTimeInterval(Self.readinessTimeoutSeconds)
    while Date() < deadline {
      if engine.outputNode.lastRenderTime != nil {
        return
      }
      Thread.sleep(forTimeInterval: Self.readinessPollSeconds)
    }
    throw SoundFontPlayerError.engineStartFailed("Timed out waiting for audio output rendering.")
  }

  private func scheduleFinish(playbackId: Int, delay: TimeInterval) {
    let workItem = DispatchWorkItem { [weak self] in
      self?.finishPlayback(playbackId: playbackId)
    }
    finishWorkItem = workItem
    workQueue.asyncAfter(deadline: .now() + delay, execute: workItem)
  }

  private func finishPlayback(playbackId: Int) {
    guard activePlaybackId == playbackId else {
      return
    }
    let handler = onPlaybackFinish
    disposePlayback(deactivateAudioSession: true)
    handler?(["playbackId": playbackId])
  }

  private func disposePlayback(deactivateAudioSession: Bool) {
    finishWorkItem?.cancel()
    finishWorkItem = nil
    sequencer?.stop()
    sequencer = nil
    silenceAllSamplers()
    if let engine = audioEngine {
      disposeGraph(engine: engine)
    }
    audioEngine = nil
    samplers.removeAll()
    activePlaybackId = nil
    if deactivateAudioSession {
      self.deactivateAudioSession()
    }
  }

  private func disposeGraph(engine: AVAudioEngine) {
    if engine.isRunning {
      engine.stop()
    }
    engine.reset()
  }

  private func deactivateAudioSession() {
    try? AVAudioSession.sharedInstance().setActive(
      false,
      options: .notifyOthersOnDeactivation
    )
  }

  private func silenceAllSamplers() {
    for sampler in samplers.values {
      for channel in UInt8(0) ... UInt8(15) {
        sampler.sendController(120, withValue: 0, onChannel: channel)
        sampler.sendController(123, withValue: 0, onChannel: channel)
      }
    }
  }

  private static func validatedMaterial(
    from parts: [[[SoundFontPlaybackCellRecord]]]
  ) throws -> PlaybackMaterial {
    guard parts.count <= maximumPartCount else {
      throw SoundFontPlayerError.invalidConfiguration(
        "Playback must contain no more than \(maximumPartCount) parts."
      )
    }
    let steps = try parts.enumerated().flatMap { partIndex, part in
      guard part.count == stepsPerPart else {
        throw SoundFontPlayerError.invalidConfiguration(
          "Part \(partIndex) must contain \(stepsPerPart) steps."
        )
      }
      try part.enumerated().forEach { stepIndex, step in
        try validate(step: step, partIndex: partIndex, stepIndex: stepIndex)
      }
      return part
    }
    return PlaybackMaterial(
      lengthBeats: Double(steps.count) * stepDurationBeats,
      notes: notes(from: steps)
    )
  }

  private static func notes(
    from steps: [[SoundFontPlaybackCellRecord]]
  ) -> [ScheduledNote] {
    var activeNotes: [Int: ActiveNote] = [:]
    var result: [ScheduledNote] = []
    for (stepIndex, step) in steps.enumerated() {
      for (laneIndex, cell) in step.enumerated() {
        if cell.midi == holdMidi {
          continue
        }
        if let activeNote = activeNotes.removeValue(forKey: laneIndex) {
          result.append(note(from: activeNote, endStepIndex: stepIndex))
        }
        if let midi = cell.midi, midi > 0, let velocity = cell.velocity {
          activeNotes[laneIndex] = ActiveNote(
            midi: UInt8(midi),
            startStepIndex: stepIndex,
            velocity: UInt8(max(1, velocity))
          )
        }
      }
    }
    for activeNote in activeNotes.values {
      result.append(note(from: activeNote, endStepIndex: steps.count))
    }
    return result.sorted {
      $0.startBeat == $1.startBeat ? $0.midi < $1.midi : $0.startBeat < $1.startBeat
    }
  }

  private static func note(
    from activeNote: ActiveNote,
    endStepIndex: Int
  ) -> ScheduledNote {
    ScheduledNote(
      durationBeats: Double(max(1, endStepIndex - activeNote.startStepIndex)) * stepDurationBeats,
      midi: activeNote.midi,
      startBeat: Double(activeNote.startStepIndex) * stepDurationBeats,
      velocity: activeNote.velocity
    )
  }

  private static func validate(
    step: [SoundFontPlaybackCellRecord],
    partIndex: Int,
    stepIndex: Int
  ) throws {
    guard !step.isEmpty else {
      throw SoundFontPlayerError.invalidConfiguration(
        "Part \(partIndex) step \(stepIndex) must contain at least one lane."
      )
    }
    for (laneIndex, cell) in step.enumerated() {
      guard let midi = cell.midi else {
        if cell.velocity != nil {
          throw SoundFontPlayerError.invalidConfiguration(
            "Part \(partIndex) step \(stepIndex) lane \(laneIndex) rest has velocity."
          )
        }
        continue
      }
      if midi == holdMidi {
        if cell.velocity != nil {
          throw SoundFontPlayerError.invalidConfiguration(
            "Part \(partIndex) step \(stepIndex) lane \(laneIndex) hold has velocity."
          )
        }
        continue
      }
      guard (1 ... 127).contains(midi),
            let velocity = cell.velocity,
            (0 ... 127).contains(velocity)
      else {
        throw SoundFontPlayerError.invalidConfiguration(
          "Part \(partIndex) step \(stepIndex) lane \(laneIndex) has invalid MIDI data."
        )
      }
    }
  }

  private static func definition(for role: InstrumentRole) -> InstrumentDefinition {
    switch role {
    case .groove:
      grooveInstrument
    case .leadIn:
      leadInInstrument
    case .piano:
      pianoInstrument
    }
  }

  private func findSoundFontURL(resourceName: String) -> URL? {
    let bundles = [Bundle.main, Bundle(for: SoundFontPlayerService.self)]
      + Bundle.allFrameworks
      + Bundle.allBundles
    return bundles.lazy.compactMap {
      $0.url(forResource: resourceName, withExtension: "sf2")
    }.first
  }

  private static func currentTimeMs() -> Double {
    Date().timeIntervalSince1970 * 1_000
  }
}
