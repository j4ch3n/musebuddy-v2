import AudioToolbox
import AVFoundation
import Foundation

// swiftlint:disable file_length

// swiftlint:disable:next type_body_length
final class SoundFontPlayerService: @unchecked Sendable {
  private struct InstrumentDefinition {
    let bankLSB: UInt8
    let bankMSB: UInt8
    let boundMidiChannel: UInt8
    let program: UInt8
    let resourceName: String
  }

  private enum InstrumentSet {
    case band
    case groove
  }

  private struct ResolvedInstrumentDefinition {
    let definition: InstrumentDefinition
    let samplerKey: String
  }

  private struct ActiveNote {
    let midi: UInt8
    let startStepIndex: Int
    let velocity: UInt8
  }

  private struct PlaybackTrack {
    let boundMidiChannel: UInt8
    let instrument: String
    let loopLengthBeats: Double
    let loopStepCount: Int
    let notes: [ScheduledNote]
    let samplerKey: String
  }

  private struct ScheduledNote {
    let durationBeats: Double
    let midi: UInt8
    let startBeat: Double
    let velocity: UInt8
  }

  private static let stepsPerPart = 16
  private static let maxPartCount = 8
  private static let stepDurationBeats = 0.25
  private static let beatsPerBar = 4.0
  private static let leadInBeatCount = 4
  private static let leadInDurationBeats = 4.0
  private static let leadInInstrumentKey = "leadInInstrument"
  private static let leadInMidiNote: UInt8 = 43
  private static let leadInMidiChannel: UInt8 = 8
  private static let pianoMidiChannel: UInt8 = 0
  private static let bassMidiChannel: UInt8 = 1
  private static let guitarMidiChannel: UInt8 = 2
  private static let groovePercussionMidiChannel: UInt8 = 3
  private static let percussionMidiChannel: UInt8 = 9
  private static let leadInInstrument = InstrumentDefinition(
    bankLSB: UInt8(kAUSampler_DefaultBankLSB),
    bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB),
    boundMidiChannel: leadInMidiChannel,
    program: 0,
    resourceName: "jazz-percussion"
  )
  private static let bandInstruments: [String: InstrumentDefinition] = [
    "piano": InstrumentDefinition(
      bankLSB: UInt8(kAUSampler_DefaultBankLSB),
      bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB),
      boundMidiChannel: pianoMidiChannel,
      program: 0,
      resourceName: "piano-white-grand"
    ),
    "bass": InstrumentDefinition(
      bankLSB: UInt8(kAUSampler_DefaultBankLSB),
      bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB),
      boundMidiChannel: bassMidiChannel,
      program: 0,
      resourceName: "bass-jazz"
    ),
    "guitar": InstrumentDefinition(
      bankLSB: UInt8(kAUSampler_DefaultBankLSB),
      bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB),
      boundMidiChannel: guitarMidiChannel,
      program: 0,
      resourceName: "classical-guitar"
    ),
    "percussion": InstrumentDefinition(
      bankLSB: UInt8(kAUSampler_DefaultBankLSB),
      bankMSB: UInt8(kAUSampler_DefaultPercussionBankMSB),
      boundMidiChannel: percussionMidiChannel,
      program: 0,
      resourceName: "drum-kit"
    ),
  ]
  private static let grooveInstruments: [String: InstrumentDefinition] = [
    "percussion": InstrumentDefinition(
      bankLSB: UInt8(kAUSampler_DefaultBankLSB),
      bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB),
      boundMidiChannel: groovePercussionMidiChannel,
      program: 0,
      resourceName: "jazz-percussion"
    ),
  ]
  private static let holdMidi = -50

  private let workQueue = DispatchQueue(
    label: "com.musebuddy.sound-font-player",
    qos: .userInitiated
  )
  private let audioEngine = AVAudioEngine()
  private var isEngineConfigured = false
  private var isPlaybackActive = false
  private var loadedInstruments = Set<String>()
  private var samplersByInstrument: [String: AVAudioUnitSampler] = [:]
  private var sequencer: AVAudioSequencer?
  private var playbackId = 0
  private var timingWorkItems: [DispatchWorkItem] = []
  private var timingTimers: [DispatchSourceTimer] = []

  var onCycleRepeat: (([String: Any]) -> Void)?
  var onDemoFinish: (([String: Any]) -> Void)?
  var onLeadInFinish: (([String: Any]) -> Void)?
  var onStep: (([String: Any]) -> Void)?
  var onTick: (([String: Any]) -> Void)?

  var isPlaying: Bool {
    workQueue.sync {
      isPlaybackActive
    }
  }

  func playBand(configuration: SoundFontPlaybackConfigurationRecord) async throws {
    try await withCheckedThrowingContinuation { continuation in
      workQueue.async {
        do {
          try self.startPlayback(configuration: configuration, instrumentSet: .band)
          continuation.resume()
        } catch {
          continuation.resume(throwing: error)
        }
      }
    }
  }

  func playGroove(configuration: SoundFontPlaybackConfigurationRecord) async throws {
    try await withCheckedThrowingContinuation { continuation in
      workQueue.async {
        do {
          try self.startPlayback(configuration: configuration, instrumentSet: .groove)
          continuation.resume()
        } catch {
          continuation.resume(throwing: error)
        }
      }
    }
  }

  func prepareSoundFonts() async throws {
    try await withCheckedThrowingContinuation { continuation in
      workQueue.async {
        do {
          try self.prepareSoundFontsOnQueue()
          continuation.resume()
        } catch {
          continuation.resume(throwing: error)
        }
      }
    }
  }

  func stop() {
    workQueue.async {
      self.stopPlayback()
    }
  }

  func stopAsync() async {
    await withCheckedContinuation { continuation in
      workQueue.async {
        self.stopPlayback()
        continuation.resume()
      }
    }
  }

  private func startPlayback(
    configuration: SoundFontPlaybackConfigurationRecord,
    instrumentSet: InstrumentSet
  ) throws {
    if isPlaybackActive {
      stopPlayback()
    }

    guard configuration.bpm.isFinite, configuration.bpm > 0 else {
      throw SoundFontPlayerError.invalidConfiguration("BPM must be positive.")
    }

    let tracks = try Self.validatedTracks(configuration.tracks, instrumentSet: instrumentSet)
    guard !tracks.isEmpty else {
      return
    }

    try prepareSamplerKeys(Set(tracks.map(\.samplerKey) + [Self.leadInInstrumentKey]))

    do {
      sequencer = try makeSequencer(
        for: tracks,
        bpm: configuration.bpm,
        cycleCount: normalizedCycleCount(configuration.cycleCount),
        includesSilentPeriod: configuration.includesSilentPeriod ?? false
      )
      sequencer?.prepareToPlay()
      sequencer?.currentPositionInBeats = 0
      try sequencer?.start()
    } catch {
      sequencer = nil
      silenceAllChannels()
      throw SoundFontPlayerError.engineStartFailed(error.localizedDescription)
    }

    isPlaybackActive = true
    playbackId += 1
    let demoStepCount = tracks.map(\.loopStepCount).max() ?? Self.stepsPerPart
    scheduleTimingEvents(
      playbackId: playbackId,
      bpm: configuration.bpm,
      cycleCount: normalizedCycleCount(configuration.cycleCount),
      demoStepCount: demoStepCount,
      includesSilentPeriod: configuration.includesSilentPeriod ?? false
    )
  }

  private func normalizedCycleCount(_ cycleCount: Int?) -> Int {
    max(1, cycleCount ?? 1)
  }

  private func configureAudioEngineIfNeeded() throws {
    guard !isEngineConfigured else {
      return
    }

    isEngineConfigured = true
  }

  private func prepareSoundFontsOnQueue() throws {
    try prepareSamplerKeys(Set(Self.allSamplerDefinitions().map(\.samplerKey)))
  }

  private func prepareSamplerKeys(_ samplerKeys: Set<String>) throws {
    for samplerKey in samplerKeys {
      let resolvedDefinition = try Self.resolvedDefinition(forSamplerKey: samplerKey)
      try attachSamplerIfNeeded(
        for: samplerKey,
        definition: resolvedDefinition.definition
      )
    }
    try startAudioEngineIfNeeded()
    for samplerKey in samplerKeys {
      let resolvedDefinition = try Self.resolvedDefinition(forSamplerKey: samplerKey)
      try loadSamplerIfNeeded(
        for: samplerKey,
        definition: resolvedDefinition.definition
      )
    }
  }

  private func attachSamplerIfNeeded(
    for samplerKey: String,
    definition _: InstrumentDefinition
  ) throws {
    guard samplersByInstrument[samplerKey] == nil else {
      return
    }

    let sampler = AVAudioUnitSampler()
    audioEngine.attach(sampler)
    audioEngine.connect(sampler, to: audioEngine.mainMixerNode, format: nil)
    samplersByInstrument[samplerKey] = sampler
  }

  private func loadSamplerIfNeeded(
    for samplerKey: String,
    definition: InstrumentDefinition
  ) throws {
    guard loadedInstruments.contains(samplerKey) == false else {
      return
    }

    guard let soundFontURL = findSoundFontURL(resourceName: definition.resourceName) else {
      throw SoundFontPlayerError.resourceMissing
    }

    guard let sampler = samplersByInstrument[samplerKey] else {
      throw SoundFontPlayerError.invalidConfiguration("Sampler for \(samplerKey) is not attached.")
    }

    do {
      try sampler.loadSoundBankInstrument(
        at: soundFontURL,
        program: definition.program,
        bankMSB: definition.bankMSB,
        bankLSB: definition.bankLSB
      )
      loadedInstruments.insert(samplerKey)
    } catch {
      let detail = "\(samplerKey) (\(definition.resourceName).sf2, program " +
        "\(definition.program), bankMSB \(definition.bankMSB), bankLSB " +
        "\(definition.bankLSB)): \(error.localizedDescription)"
      throw SoundFontPlayerError.loadFailed(detail)
    }
  }

  private func startAudioEngineIfNeeded() throws {
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
      try session.setActive(true)

      try configureAudioEngineIfNeeded()

      if !audioEngine.isRunning {
        audioEngine.prepare()
        try audioEngine.start()
      }
    } catch {
      throw SoundFontPlayerError.engineStartFailed(error.localizedDescription)
    }
  }

  private func makeSequencer(
    for tracks: [PlaybackTrack],
    bpm: Double,
    cycleCount: Int,
    includesSilentPeriod: Bool
  ) throws -> AVAudioSequencer {
    let nextSequencer = AVAudioSequencer(audioEngine: audioEngine)
    nextSequencer.tempoTrack.addEvent(AVExtendedTempoEvent(tempo: bpm), at: 0)
    try appendLeadInTrack(to: nextSequencer)
    let demoLengthBeats = tracks.map(\.loopLengthBeats).max() ?? Self.beatsPerBar
    let cycleLengthBeats = includesSilentPeriod ? demoLengthBeats * 2 : demoLengthBeats

    for playbackTrack in tracks {
      guard let sampler = samplersByInstrument[playbackTrack.samplerKey] else {
        throw SoundFontPlayerError.invalidConfiguration(
          "Sampler for \(playbackTrack.instrument) is not loaded."
        )
      }

      let track = nextSequencer.createAndAppendTrack()
      track.destinationAudioUnit = sampler

      for cycleIndex in 0 ..< cycleCount {
        let cycleStartBeat = Self.leadInDurationBeats + Double(cycleIndex) * cycleLengthBeats

        for note in playbackTrack.notes {
          let event = AVMIDINoteEvent(
            channel: UInt32(playbackTrack.boundMidiChannel),
            key: UInt32(note.midi),
            velocity: UInt32(note.velocity),
            duration: note.durationBeats
          )
          track.addEvent(event, at: cycleStartBeat + note.startBeat)
        }
      }
    }

    return nextSequencer
  }

  private func appendLeadInTrack(to sequencer: AVAudioSequencer) throws {
    guard let sampler = samplersByInstrument[Self.leadInInstrumentKey] else {
      throw SoundFontPlayerError.invalidConfiguration("Lead-in sampler is not loaded.")
    }

    let track = sequencer.createAndAppendTrack()
    track.destinationAudioUnit = sampler

    for beatIndex in 0 ..< Self.leadInBeatCount {
      let event = AVMIDINoteEvent(
        channel: UInt32(Self.leadInInstrument.boundMidiChannel),
        key: UInt32(Self.leadInMidiNote),
        velocity: 112,
        duration: 0.2
      )
      track.addEvent(event, at: Double(beatIndex))
    }
  }

  private static func resolvedDefinition(
    for instrument: String,
    instrumentSet: InstrumentSet
  ) throws -> ResolvedInstrumentDefinition {
    let definitions = switch instrumentSet {
    case .band:
      bandInstruments
    case .groove:
      grooveInstruments
    }

    guard let definition = definitions[instrument] else {
      throw SoundFontPlayerError.invalidConfiguration(
        "Unsupported instrument \(instrument)."
      )
    }

    return ResolvedInstrumentDefinition(
      definition: definition,
      samplerKey: samplerKey(for: instrument, instrumentSet: instrumentSet)
    )
  }

  private static func resolvedDefinition(
    forSamplerKey samplerKey: String
  ) throws -> ResolvedInstrumentDefinition {
    if samplerKey == leadInInstrumentKey {
      return ResolvedInstrumentDefinition(
        definition: leadInInstrument,
        samplerKey: samplerKey
      )
    }

    for resolvedDefinition in allSamplerDefinitions()
      where resolvedDefinition.samplerKey == samplerKey {
      return resolvedDefinition
    }

    throw SoundFontPlayerError.invalidConfiguration("Unsupported sampler \(samplerKey).")
  }

  private static func allSamplerDefinitions() -> [ResolvedInstrumentDefinition] {
    let bandDefinitions = bandInstruments.map { entry in
      ResolvedInstrumentDefinition(
        definition: entry.value,
        samplerKey: samplerKey(for: entry.key, instrumentSet: .band)
      )
    }
    let grooveDefinitions = grooveInstruments.map { entry in
      ResolvedInstrumentDefinition(
        definition: entry.value,
        samplerKey: samplerKey(for: entry.key, instrumentSet: .groove)
      )
    }
    let leadInDefinition = ResolvedInstrumentDefinition(
      definition: leadInInstrument,
      samplerKey: leadInInstrumentKey
    )

    return bandDefinitions + grooveDefinitions + [leadInDefinition]
  }

  private static func samplerKey(for instrument: String, instrumentSet: InstrumentSet) -> String {
    switch instrumentSet {
    case .band:
      "band:\(instrument)"
    case .groove:
      "groove:\(instrument)"
    }
  }

  private static func validatedTracks(
    _ trackRecords: [SoundFontPlaybackTrackRecord],
    instrumentSet: InstrumentSet
  ) throws -> [PlaybackTrack] {
    try trackRecords.compactMap { record in
      if record.parts.isEmpty {
        return nil
      }

      let resolvedDefinition = try resolvedDefinition(
        for: record.instrument,
        instrumentSet: instrumentSet
      )

      guard record.parts.count <= maxPartCount else {
        throw SoundFontPlayerError.invalidConfiguration(
          "Instrument \(record.instrument) must contain no more than \(maxPartCount) parts."
        )
      }

      let steps = try record.parts.enumerated().flatMap { partIndex, part in
        guard part.count == stepsPerPart else {
          throw SoundFontPlayerError.invalidConfiguration(
            "Instrument \(record.instrument) part \(partIndex) must contain \(stepsPerPart) steps."
          )
        }

        try part.enumerated().forEach { stepIndex, step in
          try validateStep(
            step,
            instrument: record.instrument,
            partIndex: partIndex,
            stepIndex: stepIndex
          )
        }

        return part
      }

      let scheduledNotes = notes(from: steps)
      if scheduledNotes.isEmpty {
        return nil
      }

      return PlaybackTrack(
        boundMidiChannel: resolvedDefinition.definition.boundMidiChannel,
        instrument: record.instrument,
        loopLengthBeats: Double(steps.count) * stepDurationBeats,
        loopStepCount: steps.count,
        notes: scheduledNotes,
        samplerKey: resolvedDefinition.samplerKey
      )
    }
  }

  private func finishPlayback() {
    cancelTimingEvents()
    sequencer?.stop()
    sequencer = nil
    silenceAllChannels()
    isPlaybackActive = false
  }

  private func stopPlayback() {
    finishPlayback()
  }

  private func scheduleTimingEvents(
    playbackId: Int,
    bpm: Double,
    cycleCount: Int,
    demoStepCount: Int,
    includesSilentPeriod: Bool
  ) {
    cancelTimingEvents()

    let secondsPerBeat = 60.0 / bpm
    let leadInDurationSeconds = Double(Self.leadInBeatCount) * secondsPerBeat
    let stepDurationSeconds = Self.stepDurationBeats * secondsPerBeat
    let demoDurationSeconds = Double(demoStepCount) * stepDurationSeconds
    let cycleDurationSeconds = includesSilentPeriod ? demoDurationSeconds * 2 : demoDurationSeconds
    let basePayload: [String: Any] = [
      "playbackId": playbackId,
      "bpm": bpm,
    ]

    scheduleTimingWorkItem(after: leadInDurationSeconds) { [weak self] in
      guard let self, isPlaybackActive, self.playbackId == playbackId else {
        return
      }

      onLeadInFinish?(basePayload)
    }

    for cycleIndex in 0 ..< cycleCount {
      let cycleStartDelay = leadInDurationSeconds + Double(cycleIndex) * cycleDurationSeconds
      let completedCycleCount = cycleIndex + 1
      let cyclePayload = basePayload.merging([
        "cycleIndex": cycleIndex,
        "completedCycleCount": completedCycleCount,
        "includesSilentPeriod": includesSilentPeriod,
      ]) { _, new in new }

      scheduleDemoStepEvents(
        playbackId: playbackId,
        bpm: bpm,
        cycleStartDelay: cycleStartDelay,
        demoStepCount: demoStepCount,
        stepDurationSeconds: stepDurationSeconds
      )

      scheduleTimingWorkItem(after: cycleStartDelay + demoDurationSeconds) { [weak self] in
        guard let self, isPlaybackActive, self.playbackId == playbackId else {
          return
        }

        onDemoFinish?(cyclePayload)
      }

      scheduleTimingWorkItem(after: cycleStartDelay + cycleDurationSeconds) { [weak self] in
        guard let self, isPlaybackActive, self.playbackId == playbackId else {
          return
        }

        onCycleRepeat?(
          cyclePayload.merging(["willRepeat": completedCycleCount < cycleCount]) { _, new in new }
        )

        if completedCycleCount >= cycleCount {
          finishPlayback()
        }
      }
    }

    scheduleRepeatingTimingTimer(
      firstDelay: 0,
      interval: secondsPerBeat
    ) { [weak self] tickIndex in
      guard let self, isPlaybackActive, self.playbackId == playbackId else {
        return
      }

      onTick?([
        "playbackId": playbackId,
        "bpm": bpm,
        "event": "beat",
        "beatIndex": tickIndex,
      ])
    }

    scheduleRepeatingTimingTimer(
      firstDelay: 0,
      interval: Self.beatsPerBar * secondsPerBeat
    ) { [weak self] tickIndex in
      guard let self, isPlaybackActive, self.playbackId == playbackId else {
        return
      }

      onTick?([
        "playbackId": playbackId,
        "bpm": bpm,
        "event": "bar",
        "barIndex": tickIndex,
      ])
    }
  }

  private func scheduleDemoStepEvents(
    playbackId: Int,
    bpm: Double,
    cycleStartDelay: TimeInterval,
    demoStepCount: Int,
    stepDurationSeconds: TimeInterval
  ) {
    for stepIndex in 0 ..< demoStepCount {
      scheduleTimingWorkItem(after: cycleStartDelay + Double(stepIndex) * stepDurationSeconds) { [weak self] in
        guard let self, isPlaybackActive, self.playbackId == playbackId else {
          return
        }

        onStep?([
          "playbackId": playbackId,
          "bpm": bpm,
          "stepIndex": stepIndex,
          "barIndex": stepIndex / Self.stepsPerPart,
          "stepIndexInBar": stepIndex % Self.stepsPerPart,
        ])
      }
    }
  }

  private func scheduleTimingWorkItem(after delay: TimeInterval, execute: @escaping () -> Void) {
    let workItem = DispatchWorkItem(block: execute)
    timingWorkItems.append(workItem)
    workQueue.asyncAfter(deadline: .now() + delay, execute: workItem)
  }

  private func scheduleRepeatingTimingTimer(
    firstDelay: TimeInterval,
    interval: TimeInterval,
    eventHandler: @escaping (Int) -> Void
  ) {
    let timer = DispatchSource.makeTimerSource(queue: workQueue)
    var tickIndex = 0

    timer.schedule(
      deadline: .now() + firstDelay,
      repeating: interval,
      leeway: .milliseconds(5)
    )
    timer.setEventHandler {
      eventHandler(tickIndex)
      tickIndex += 1
    }
    timingTimers.append(timer)
    timer.resume()
  }

  private func cancelTimingEvents() {
    timingWorkItems.forEach { $0.cancel() }
    timingWorkItems.removeAll()
    timingTimers.forEach { $0.cancel() }
    timingTimers.removeAll()
  }

  private func silenceAllChannels() {
    for sampler in samplersByInstrument.values {
      for channel in UInt8(0) ... UInt8(15) {
        sampler.sendController(120, withValue: 0, onChannel: channel)
        sampler.sendController(123, withValue: 0, onChannel: channel)
      }
    }
  }

  private func findSoundFontURL(resourceName: String) -> URL? {
    let candidateBundles = [Bundle.main, Bundle(for: SoundFontPlayerService.self)]
      + Bundle.allFrameworks
      + Bundle.allBundles

    for bundle in candidateBundles {
      if let url = bundle.url(forResource: resourceName, withExtension: "sf2") {
        return url
      }
    }

    return nil
  }

  private static func notes(
    from steps: [[SoundFontPlaybackCellRecord]]
  ) -> [ScheduledNote] {
    var activeNotesByLane: [Int: ActiveNote] = [:]
    var notes: [ScheduledNote] = []

    for (stepIndex, step) in steps.enumerated() {
      for (laneIndex, cell) in step.enumerated() {
        if cell.midi == holdMidi {
          continue
        }

        if let activeNote = activeNotesByLane[laneIndex] {
          notes.append(note(from: activeNote, endStepIndex: stepIndex))
          activeNotesByLane.removeValue(forKey: laneIndex)
        }

        if let midi = cell.midi, midi > 0, let velocity = cell.velocity {
          activeNotesByLane[laneIndex] = ActiveNote(
            midi: UInt8(midi),
            startStepIndex: stepIndex,
            velocity: UInt8(max(1, velocity))
          )
        }
      }
    }

    for activeNote in activeNotesByLane.values {
      notes.append(note(from: activeNote, endStepIndex: steps.count))
    }

    return notes.sorted {
      if $0.startBeat == $1.startBeat {
        return $0.midi < $1.midi
      }

      return $0.startBeat < $1.startBeat
    }
  }

  private static func note(from activeNote: ActiveNote, endStepIndex: Int) -> ScheduledNote {
    let durationSteps = max(1, endStepIndex - activeNote.startStepIndex)

    return ScheduledNote(
      durationBeats: Double(durationSteps) * stepDurationBeats,
      midi: activeNote.midi,
      startBeat: Double(activeNote.startStepIndex) * stepDurationBeats,
      velocity: activeNote.velocity
    )
  }

  private static func validateStep(
    _ step: [SoundFontPlaybackCellRecord],
    instrument: String,
    partIndex: Int,
    stepIndex: Int
  ) throws {
    guard !step.isEmpty else {
      throw SoundFontPlayerError.invalidConfiguration(
        "Instrument \(instrument) part \(partIndex) step \(stepIndex) must contain at least one lane."
      )
    }

    try step.enumerated().forEach { laneIndex, cell in
      guard let midi = cell.midi else {
        if cell.velocity != nil {
          let detail = "Instrument \(instrument) part \(partIndex) step \(stepIndex) " +
            "lane \(laneIndex) rest must not carry velocity."
          throw SoundFontPlayerError.invalidConfiguration(
            detail
          )
        }

        return
      }

      if midi == holdMidi {
        if cell.velocity != nil {
          let detail = "Instrument \(instrument) part \(partIndex) step \(stepIndex) " +
            "lane \(laneIndex) hold must not carry velocity."
          throw SoundFontPlayerError.invalidConfiguration(
            detail
          )
        }

        return
      }

      guard (1 ... 127).contains(midi) else {
        throw SoundFontPlayerError.invalidConfiguration(
          "Instrument \(instrument) part \(partIndex) step \(stepIndex) lane \(laneIndex) has invalid MIDI value."
        )
      }

      guard let velocity = cell.velocity, (0 ... 127).contains(velocity) else {
        throw SoundFontPlayerError.invalidConfiguration(
          "Instrument \(instrument) part \(partIndex) step \(stepIndex) lane \(laneIndex) has invalid velocity."
        )
      }
    }
  }
}
