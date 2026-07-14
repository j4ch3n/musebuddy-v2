import AudioToolbox
import AVFoundation
import Foundation

// swiftlint:disable file_length

final class SoundFontPlayerService: @unchecked Sendable { // swiftlint:disable:this type_body_length
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
    let notes: [ScheduledNote]
    let samplerKey: String
  }

  private struct ScheduledNote {
    let durationBeats: Double
    let midi: UInt8
    let startBeat: Double
    let velocity: UInt8
  }

  private struct PlaybackScheduleOptions {
    let cycles: Int
    let demoLengthBeats: Double
    let includeLeadIn: Bool
    let repeats: Bool
  }

  private struct ActivePlayback {
    let barCountPerCycle: Int
    let bpm: Double
    let completedCycles: Int
    let demoLengthBeats: Double
    let demoStartBeat: Double
    let playbackId: Int
    let startedAtAbsoluteTimeMs: Double
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
  private var activePlayback: ActivePlayback?
  private var playbackId = 0
  private var timingWorkItems: [DispatchWorkItem] = []

  var onPlaybackBar: (([String: Any]) -> Void)?
  var onPlaybackFinish: (([String: Any]) -> Void)?

  var isPlaying: Bool {
    workQueue.sync {
      isPlaybackActive
    }
  }

  func playBand(
    configuration: SoundFontPlaybackConfigurationRecord,
    options: SoundFontPlaybackOptionsRecord
  ) async throws -> Int {
    try await withCheckedThrowingContinuation { continuation in
      workQueue.async {
        do {
          let playbackId = try self.startPlayback(
            configuration: configuration,
            options: options,
            instrumentSet: .band
          )
          continuation.resume(returning: playbackId)
        } catch {
          continuation.resume(throwing: error)
        }
      }
    }
  }

  func playGroove(
    configuration: SoundFontPlaybackConfigurationRecord,
    options: SoundFontPlaybackOptionsRecord
  ) async throws -> Int {
    try await withCheckedThrowingContinuation { continuation in
      workQueue.async {
        do {
          let playbackId = try self.startPlayback(
            configuration: configuration,
            options: options,
            instrumentSet: .groove
          )
          continuation.resume(returning: playbackId)
        } catch {
          continuation.resume(throwing: error)
        }
      }
    }
  }

  func restartBand(
    configuration: SoundFontPlaybackConfigurationRecord,
    options: SoundFontPlaybackOptionsRecord
  ) async throws -> Int {
    try await playBand(configuration: configuration, options: options)
  }

  func restartGroove(
    configuration: SoundFontPlaybackConfigurationRecord,
    options: SoundFontPlaybackOptionsRecord
  ) async throws -> Int {
    try await playGroove(configuration: configuration, options: options)
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
    options: SoundFontPlaybackOptionsRecord,
    instrumentSet: InstrumentSet
  ) throws -> Int {
    if isPlaybackActive {
      stopPlayback()
    }

    guard configuration.bpm.isFinite, configuration.bpm > 0 else {
      throw SoundFontPlayerError.invalidConfiguration("BPM must be positive.")
    }

    let tracks = try Self.validatedTracks(configuration.tracks, instrumentSet: instrumentSet)
    guard !tracks.isEmpty else {
      throw SoundFontPlayerError.emptyConfiguration
    }

    try prepareSamplerKeys(Set(tracks.map(\.samplerKey) + [Self.leadInInstrumentKey]))

    let cycleCount = normalizedCycleCount(options.cycles)
    let demoLengthBeats = tracks.map(\.loopLengthBeats).max() ?? Self.beatsPerBar
    playbackId += 1
    let nextPlaybackId = playbackId

    do {
      sequencer = try makeSequencer(
        for: tracks,
        bpm: configuration.bpm,
        options: PlaybackScheduleOptions(
          cycles: cycleCount,
          demoLengthBeats: demoLengthBeats,
          includeLeadIn: options.leadIn,
          repeats: options.repeat
        )
      )
      sequencer?.prepareToPlay()
      sequencer?.currentPositionInBeats = 0
      try primeSamplerPrograms(for: tracks, includeLeadIn: options.leadIn)
      try sequencer?.start()
    } catch {
      sequencer = nil
      silenceAllChannels()
      throw SoundFontPlayerError.engineStartFailed(error.localizedDescription)
    }

    isPlaybackActive = true
    let secondsPerBeat = 60.0 / configuration.bpm
    let leadInDurationSeconds = options.leadIn ? Double(Self.leadInBeatCount) * secondsPerBeat : 0
    let completedCycles = options.repeat ? 0 : cycleCount
    let demoStartBeat = options.leadIn ? Self.leadInDurationBeats : 0
    let barCountPerCycle = Int(ceil(demoLengthBeats / Self.beatsPerBar))
    activePlayback = ActivePlayback(
      barCountPerCycle: barCountPerCycle,
      bpm: configuration.bpm,
      completedCycles: completedCycles,
      demoLengthBeats: demoLengthBeats,
      demoStartBeat: demoStartBeat,
      playbackId: nextPlaybackId,
      startedAtAbsoluteTimeMs: Self.currentAbsoluteTimeMs()
    )
    schedulePlaybackBars(
      playbackId: nextPlaybackId,
      cycleCount: cycleCount,
      repeats: options.repeat,
      secondsPerBeat: secondsPerBeat
    )
    if !options.repeat {
      schedulePlaybackFinish(
        playbackId: nextPlaybackId,
        after: leadInDurationSeconds + demoLengthBeats * Double(cycleCount) * secondsPerBeat
      )
    }

    return nextPlaybackId
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

  private func primeSamplerPrograms(
    for tracks: [PlaybackTrack],
    includeLeadIn: Bool
  ) throws {
    if includeLeadIn {
      try primeSamplerProgram(
        samplerKey: Self.leadInInstrumentKey,
        definition: Self.leadInInstrument,
        midiChannel: Self.leadInInstrument.boundMidiChannel
      )
    }

    for playbackTrack in tracks {
      let resolvedDefinition = try Self.resolvedDefinition(forSamplerKey: playbackTrack.samplerKey)
      try primeSamplerProgram(
        samplerKey: playbackTrack.samplerKey,
        definition: resolvedDefinition.definition,
        midiChannel: playbackTrack.boundMidiChannel
      )
    }
  }

  private func primeSamplerProgram(
    samplerKey: String,
    definition: InstrumentDefinition,
    midiChannel: UInt8
  ) throws {
    guard let sampler = samplersByInstrument[samplerKey] else {
      throw SoundFontPlayerError.invalidConfiguration("Sampler for \(samplerKey) is not attached.")
    }

    sampler.sendProgramChange(
      definition.program,
      bankMSB: definition.bankMSB,
      bankLSB: definition.bankLSB,
      onChannel: midiChannel
    )
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
    options: PlaybackScheduleOptions
  ) throws -> AVAudioSequencer {
    let nextSequencer = AVAudioSequencer(audioEngine: audioEngine)
    nextSequencer.tempoTrack.addEvent(AVExtendedTempoEvent(tempo: bpm), at: 0)
    if options.includeLeadIn {
      try appendLeadInTrack(to: nextSequencer)
    }
    let demoStartBeat = options.includeLeadIn ? Self.leadInDurationBeats : 0

    for playbackTrack in tracks {
      guard let sampler = samplersByInstrument[playbackTrack.samplerKey] else {
        throw SoundFontPlayerError.invalidConfiguration(
          "Sampler for \(playbackTrack.instrument) is not loaded."
        )
      }

      let track = nextSequencer.createAndAppendTrack()
      track.destinationAudioUnit = sampler

      let scheduledCycles = options.repeats ? 1 : options.cycles
      for cycleIndex in 0 ..< scheduledCycles {
        let cycleStartBeat = demoStartBeat + Double(cycleIndex) * options.demoLengthBeats
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

      if options.repeats {
        track.isLoopingEnabled = true
        track.numberOfLoops = AVMusicTrackLoopCount.forever.rawValue
        track.loopRange = AVBeatRange(start: demoStartBeat, length: options.demoLengthBeats)
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
        notes: scheduledNotes,
        samplerKey: resolvedDefinition.samplerKey
      )
    }
  }

  private func finishPlayback() {
    cancelTimingEvents()
    sequencer?.stop()
    sequencer = nil
    activePlayback = nil
    silenceAllChannels()
    isPlaybackActive = false
  }

  private func stopPlayback() {
    finishPlayback()
  }

  private func schedulePlaybackFinish(playbackId: Int, after delay: TimeInterval) {
    scheduleTimingWorkItem(after: delay) { [weak self] in
      self?.finishCurrentPlayback(playbackId: playbackId)
    }
  }

  private func schedulePlaybackBars(
    playbackId: Int,
    cycleCount: Int,
    repeats: Bool,
    secondsPerBeat: Double
  ) {
    guard let playback = activePlayback, playback.barCountPerCycle > 0 else {
      return
    }

    if repeats {
      scheduleRepeatingPlaybackBar(
        playbackId: playbackId,
        cycleIndex: 0,
        barInCycle: 0,
        delayBeats: playback.demoStartBeat,
        secondsPerBeat: secondsPerBeat
      )
      return
    }

    for cycleIndex in 0 ..< cycleCount {
      for barInCycle in 0 ..< playback.barCountPerCycle {
        let playbackPositionBeats = barStartBeat(
          playback: playback,
          cycleIndex: cycleIndex,
          barInCycle: barInCycle
        )
        guard playbackPositionBeats < playback.demoStartBeat +
          Double(cycleIndex + 1) * playback.demoLengthBeats
        else {
          continue
        }

        scheduleTimingWorkItem(after: playbackPositionBeats * secondsPerBeat) { [weak self] in
          self?.emitPlaybackBar(
            playbackId: playbackId,
            cycleIndex: cycleIndex,
            barInCycle: barInCycle,
            playbackPositionBeats: playbackPositionBeats,
            secondsPerBeat: secondsPerBeat
          )
        }
      }
    }
  }

  private func scheduleRepeatingPlaybackBar(
    playbackId: Int,
    cycleIndex: Int,
    barInCycle: Int,
    delayBeats: Double,
    secondsPerBeat: Double
  ) {
    guard let playback = activePlayback, playback.playbackId == playbackId else {
      return
    }

    let playbackPositionBeats = barStartBeat(
      playback: playback,
      cycleIndex: cycleIndex,
      barInCycle: barInCycle
    )

    scheduleTimingWorkItem(after: delayBeats * secondsPerBeat) { [weak self] in
      guard let self else {
        return
      }

      emitPlaybackBar(
        playbackId: playbackId,
        cycleIndex: cycleIndex,
        barInCycle: barInCycle,
        playbackPositionBeats: playbackPositionBeats,
        secondsPerBeat: secondsPerBeat
      )

      guard isPlaybackActive, activePlayback?.playbackId == playbackId else {
        return
      }

      let nextBarInCycle = (barInCycle + 1) % playback.barCountPerCycle
      let nextCycleIndex = nextBarInCycle == 0 ? cycleIndex + 1 : cycleIndex
      let nextDelayBeats = nextBarInCycle == 0
        ? playback.demoLengthBeats - Double(playback.barCountPerCycle - 1) * Self.beatsPerBar
        : Self.beatsPerBar
      scheduleRepeatingPlaybackBar(
        playbackId: playbackId,
        cycleIndex: nextCycleIndex,
        barInCycle: nextBarInCycle,
        delayBeats: nextDelayBeats,
        secondsPerBeat: secondsPerBeat
      )
    }
  }

  private func barStartBeat(
    playback: ActivePlayback,
    cycleIndex: Int,
    barInCycle: Int
  ) -> Double {
    playback.demoStartBeat +
      Double(cycleIndex) * playback.demoLengthBeats +
      Double(barInCycle) * Self.beatsPerBar
  }

  private func emitPlaybackBar(
    playbackId: Int,
    cycleIndex: Int,
    barInCycle: Int,
    playbackPositionBeats: Double,
    secondsPerBeat: Double
  ) {
    guard isPlaybackActive, let playback = activePlayback, playback.playbackId == playbackId else {
      return
    }

    let playbackPositionMs = playbackPositionBeats * secondsPerBeat * 1_000
    let payload: [String: Any] = [
      "playbackId": playback.playbackId,
      "bpm": playback.bpm,
      "barIndex": cycleIndex * playback.barCountPerCycle + barInCycle,
      "cycleIndex": cycleIndex,
      "barInCycle": barInCycle,
      "playbackPositionMs": playbackPositionMs,
      "absoluteTimeMs": playback.startedAtAbsoluteTimeMs + playbackPositionMs,
    ]

    emitPlaybackEvent(
      playbackId: playback.playbackId,
      payload: payload,
      handler: onPlaybackBar
    )
  }

  private func finishCurrentPlayback(playbackId: Int) {
    guard isPlaybackActive, self.playbackId == playbackId, let playback = activePlayback else {
      return
    }

    let payload: [String: Any] = [
      "playbackId": playback.playbackId,
      "bpm": playback.bpm,
      "completedCycles": playback.completedCycles,
    ]

    emitPlaybackEvent(
      playbackId: playback.playbackId,
      payload: payload,
      handler: onPlaybackFinish
    )
    finishPlayback()
  }

  private func emitPlaybackEvent(
    playbackId: Int,
    payload: [String: Any],
    handler: (([String: Any]) -> Void)?
  ) {
    guard isPlaybackActive, activePlayback?.playbackId == playbackId else {
      return
    }

    handler?(payload)
  }

  private func scheduleTimingWorkItem(after delay: TimeInterval, execute: @escaping () -> Void) {
    let workItem = DispatchWorkItem(block: execute)
    timingWorkItems.append(workItem)
    workQueue.asyncAfter(deadline: .now() + delay, execute: workItem)
  }

  private func cancelTimingEvents() {
    timingWorkItems.forEach { $0.cancel() }
    timingWorkItems.removeAll()
  }

  private static func currentAbsoluteTimeMs() -> Double {
    Date().timeIntervalSince1970 * 1_000
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
