import AudioToolbox
import AVFoundation
import Foundation

final class SoundFontPlayerService: @unchecked Sendable {
  private struct ScheduledNote {
    let channel: UInt8
    let durationSeconds: TimeInterval
    let midi: UInt8
    let startTimeSeconds: TimeInterval
    let velocity: UInt8
  }

  private enum PianoSoundFont {
    static let bankLSB = UInt8(kAUSampler_DefaultBankLSB)
    static let bankMSB = UInt8(kAUSampler_DefaultMelodicBankMSB)
    static let program: UInt8 = 0
  }

  private let workQueue = DispatchQueue(
    label: "com.musebuddy.sound-font-player",
    qos: .userInitiated
  )
  private let audioEngine = AVAudioEngine()
  private let sampler = AVAudioUnitSampler()
  private var completionWorkItem: DispatchWorkItem?
  private var isEngineConfigured = false
  private var isSamplerLoaded = false
  private var isPlaybackActive = false
  private var sequencer: AVAudioSequencer?

  var isPlaying: Bool {
    workQueue.sync {
      isPlaybackActive
    }
  }

  func play(configuration: SoundFontPlaybackConfigurationRecord) async throws {
    try await withCheckedThrowingContinuation { continuation in
      workQueue.async {
        do {
          try self.startPlayback(configuration: configuration)
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

  private func startPlayback(configuration: SoundFontPlaybackConfigurationRecord) throws {
    if isPlaybackActive {
      stopPlayback()
    }

    guard configuration.instrument == "piano" else {
      throw SoundFontPlayerError.invalidConfiguration("Unsupported instrument \(configuration.instrument).")
    }

    guard configuration.bpm.isFinite, configuration.bpm > 0 else {
      throw SoundFontPlayerError.invalidConfiguration("BPM must be positive.")
    }

    guard configuration.slotDurationSeconds.isFinite, configuration.slotDurationSeconds > 0 else {
      throw SoundFontPlayerError.invalidConfiguration("Slot duration must be positive.")
    }

    let notes = try configuration.notes.map(Self.validatedNote)
    guard !notes.isEmpty else {
      throw SoundFontPlayerError.emptyConfiguration
    }

    try startAudioEngineIfNeeded()
    try loadSamplerIfNeeded()

    let playbackLength = notes.reduce(TimeInterval(0)) {
      max($0, $1.startTimeSeconds + $1.durationSeconds)
    }

    do {
      sequencer = try makeSequencer(for: notes)
      sequencer?.prepareToPlay()
      sequencer?.currentPositionInBeats = 0
      try sequencer?.start()
    } catch {
      sequencer = nil
      silenceAllChannels()
      throw SoundFontPlayerError.engineStartFailed(error.localizedDescription)
    }

    isPlaybackActive = true

    let finishItem = DispatchWorkItem { [weak self] in
      self?.finishPlayback()
    }
    completionWorkItem = finishItem
    workQueue.asyncAfter(
      deadline: DispatchTime.now() + .milliseconds(Int(((playbackLength + 0.1) * 1_000).rounded())),
      execute: finishItem
    )
  }

  private func configureAudioEngineIfNeeded() throws {
    guard !isEngineConfigured else {
      return
    }

    audioEngine.attach(sampler)
    audioEngine.connect(sampler, to: audioEngine.mainMixerNode, format: nil)
    isEngineConfigured = true
  }

  private func loadSamplerIfNeeded() throws {
    guard !isSamplerLoaded else {
      return
    }

    guard let soundFontURL = findSoundFontURL() else {
      throw SoundFontPlayerError.resourceMissing
    }

    do {
      try sampler.loadSoundBankInstrument(
        at: soundFontURL,
        program: PianoSoundFont.program,
        bankMSB: PianoSoundFont.bankMSB,
        bankLSB: PianoSoundFont.bankLSB
      )
      isSamplerLoaded = true
    } catch {
      throw SoundFontPlayerError.loadFailed(error.localizedDescription)
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

  private func makeSequencer(for notes: [ScheduledNote]) throws -> AVAudioSequencer {
    let nextSequencer = AVAudioSequencer(audioEngine: audioEngine)
    nextSequencer.tempoTrack.addEvent(AVExtendedTempoEvent(tempo: 60), at: 0)

    let track = nextSequencer.createAndAppendTrack()
    track.destinationAudioUnit = sampler

    for note in notes {
      let event = AVMIDINoteEvent(
        channel: UInt32(note.channel),
        key: UInt32(note.midi),
        velocity: UInt32(note.velocity),
        duration: note.durationSeconds
      )
      track.addEvent(event, at: note.startTimeSeconds)
    }

    return nextSequencer
  }

  private func finishPlayback() {
    sequencer?.stop()
    sequencer = nil
    completionWorkItem?.cancel()
    completionWorkItem = nil
    silenceAllChannels()
    isPlaybackActive = false
  }

  private func stopPlayback() {
    completionWorkItem?.cancel()
    completionWorkItem = nil
    finishPlayback()
  }

  private func silenceAllChannels() {
    for channel in UInt8(0) ... UInt8(15) {
      sampler.sendController(120, withValue: 0, onChannel: channel)
      sampler.sendController(123, withValue: 0, onChannel: channel)
    }
  }

  private func findSoundFontURL() -> URL? {
    let candidateBundles = [Bundle.main, Bundle(for: SoundFontPlayerService.self)]
      + Bundle.allFrameworks
      + Bundle.allBundles

    for bundle in candidateBundles {
      if let url = bundle.url(forResource: "piano-yamaha-PSRF50", withExtension: "sf2") {
        return url
      }
    }

    return nil
  }

  private static func validatedNote(_ note: SoundFontPlaybackNoteRecord) throws -> ScheduledNote {
    guard note.startTimeSeconds.isFinite, note.startTimeSeconds >= 0 else {
      throw SoundFontPlayerError.invalidConfiguration("Note \(note.id) has an invalid start time.")
    }

    guard note.durationSeconds.isFinite, note.durationSeconds > 0 else {
      throw SoundFontPlayerError.invalidConfiguration("Note \(note.id) has an invalid duration.")
    }

    guard (1 ... 127).contains(note.midi) else {
      throw SoundFontPlayerError.invalidConfiguration("Note \(note.id) has an invalid MIDI value.")
    }

    guard (0 ... 127).contains(note.velocity) else {
      throw SoundFontPlayerError.invalidConfiguration("Note \(note.id) has an invalid velocity.")
    }

    guard (0 ... 15).contains(note.channel) else {
      throw SoundFontPlayerError.invalidConfiguration("Note \(note.id) has an invalid channel.")
    }

    return ScheduledNote(
      channel: UInt8(note.channel),
      durationSeconds: note.durationSeconds,
      midi: UInt8(note.midi),
      startTimeSeconds: note.startTimeSeconds,
      velocity: UInt8(max(1, note.velocity))
    )
  }
}
