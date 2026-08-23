import Accelerate
import Foundation

/// Configuration values are expressed in detector-time units. The detector preserves
/// the 32 ms / 8 ms analysis durations when a microphone has a sample rate other
/// than 16 kHz, rather than assuming a particular input hardware format.
struct SpectralFluxConfiguration {
  var fftSize = 512
  var hopSize = 128
  var referenceSampleRate = 16_000.0
  var minimumFrequency = 100.0
  var maximumFrequency = 7_500.0
  var magnitudeCompression: Float = 10
  var thresholdHistorySeconds = 0.75
  var thresholdMultiplier: Float = 3
  var minimumFlux: Float = 0.000_02
  var minimumProminence: Float = 0.02
  /// Required flux-to-adaptive-threshold ratio. This rejects weak spectral
  /// changes that are technically local peaks but do not stand out locally.
  var minimumThresholdRatio: Float = 1.5
  /// A candidate must rise 1.5 dB above the recent frame-RMS median. This
  /// rejects weak local noise while retaining the validated quiet attacks.
  var minimumRmsRiseDb: Float = 1.5
  var cooldownMs = 120.0
  var highPassCutoffHz = 80.0
  var useSquaredFlux = true
  var normalizeSpectrum = false

  init(options: [String: Double] = [:]) {
    fftSize = Self.powerOfTwo(options["fftSize"], defaultValue: fftSize)
    hopSize = Self.positiveInt(options["hopSize"], defaultValue: hopSize)
    minimumFrequency = Self.value("minimumFrequency", options, minimumFrequency, minimum: 0)
    maximumFrequency = Self.value("maximumFrequency", options, maximumFrequency, minimum: 1)
    magnitudeCompression = Float(Self.value("magnitudeCompression", options, Double(magnitudeCompression), minimum: 0))
    thresholdHistorySeconds = Self.value("thresholdHistorySeconds", options, thresholdHistorySeconds, minimum: 0.1)
    thresholdMultiplier = Float(Self.value("thresholdMultiplier", options, Double(thresholdMultiplier), minimum: 0))
    minimumFlux = Float(Self.value("minimumFlux", options, Double(minimumFlux), minimum: 0))
    minimumProminence = Float(Self.value("minimumProminence", options, Double(minimumProminence), minimum: 0))
    minimumThresholdRatio = Float(Self.value("minimumThresholdRatio", options, Double(minimumThresholdRatio), minimum: 1))
    minimumRmsRiseDb = Float(Self.value("minimumRmsRiseDb", options, Double(minimumRmsRiseDb), minimum: 0))
    cooldownMs = Self.value("cooldownMs", options, cooldownMs, minimum: 0)
    highPassCutoffHz = Self.value("highPassCutoffHz", options, highPassCutoffHz, minimum: 0)
    useSquaredFlux = (options["useSquaredFlux"] ?? 1) >= 0.5
    normalizeSpectrum = (options["normalizeSpectrum"] ?? 0) >= 0.5
  }

  private static func value(_ key: String, _ options: [String: Double], _ defaultValue: Double, minimum: Double) -> Double {
    guard let value = options[key], value.isFinite else { return defaultValue }
    return max(value, minimum)
  }

  private static func positiveInt(_ value: Double?, defaultValue: Int) -> Int {
    guard let value, value.isFinite else { return defaultValue }
    return max(1, Int(value.rounded()))
  }

  private static func powerOfTwo(_ value: Double?, defaultValue: Int) -> Int {
    let requested = positiveInt(value, defaultValue: defaultValue)
    guard requested > 0, requested & (requested - 1) == 0 else { return defaultValue }
    return requested
  }
}

struct OnsetEvent: Equatable {
  let sampleIndex: Int64
  let timestampSeconds: Double
  let spectralFlux: Float
  let adaptiveThreshold: Float
  let prominence: Float
  let confidence: Float
  let frameRmsDbfs: Float
}

struct SpectralFluxAnalysisFrame {
  let sampleIndex: Int64
  let spectralFlux: Float
  let adaptiveThreshold: Float
  let frameRmsDbfs: Float
}

enum SpectralFluxMath {
  static func positiveFlux(current: [Float], previous: [Float], range: Range<Int>, squared: Bool) -> Float {
    precondition(current.count == previous.count)
    var total: Float = 0
    for index in range {
      let difference = max(0, current[index] - previous[index])
      total += squared ? difference * difference : difference
    }
    return total / Float(range.count)
  }
}

/// Reusable real FFT implementation. `vDSP_fft_zrip` packs the positive half
/// spectrum in its split-complex buffer; callers deliberately ignore the DC bin.
final class RealSpectrumAnalyzer {
  let fftSize: Int
  private let log2n: vDSP_Length
  private let setup: FFTSetup
  private let window: [Float]
  private var packed: [Float]
  private(set) var magnitudes: [Float]

  init?(fftSize: Int) {
    guard fftSize > 1, fftSize & (fftSize - 1) == 0 else { return nil }
    self.fftSize = fftSize
    log2n = vDSP_Length(log2(Double(fftSize)))
    guard let setup = vDSP_create_fftsetup(log2n, FFTRadix(kFFTRadix2)) else { return nil }
    self.setup = setup
    window = vDSP.window(ofType: Float.self, usingSequence: .hanningDenormalized, count: fftSize, isHalfWindow: false)
    packed = Array(repeating: 0, count: fftSize)
    magnitudes = Array(repeating: 0, count: fftSize / 2)
  }

  deinit { vDSP_destroy_fftsetup(setup) }

  func magnitudeSpectrum(frame: UnsafeBufferPointer<Float>) -> UnsafeBufferPointer<Float> {
    precondition(frame.count == fftSize)
    packed.withUnsafeMutableBufferPointer { packedBuffer in
      vDSP_vmul(frame.baseAddress!, 1, window, 1, packedBuffer.baseAddress!, 1, vDSP_Length(fftSize))
      packedBuffer.baseAddress!.withMemoryRebound(to: DSPComplex.self, capacity: fftSize / 2) { complex in
        var split = DSPSplitComplex(realp: UnsafeMutableRawPointer(complex).assumingMemoryBound(to: Float.self), imagp: UnsafeMutableRawPointer(complex).assumingMemoryBound(to: Float.self).advanced(by: 1))
        vDSP_ctoz(complex, 2, &split, 1, vDSP_Length(fftSize / 2))
        vDSP_fft_zrip(setup, &split, 1, log2n, FFTDirection(FFT_FORWARD))
        vDSP_zvabs(&split, 1, &magnitudes, 1, vDSP_Length(fftSize / 2))
      }
    }
    return magnitudes.withUnsafeBufferPointer { $0 }
  }

  static func hannWindow(fftSize: Int) -> [Float] {
    vDSP.window(ofType: Float.self, usingSequence: .hanningDenormalized, count: fftSize, isHalfWindow: false)
  }
}

final class SpectralFluxDetector {
  private struct Peak { let flux, threshold, frameRmsDbfs, rmsBaselineDbfs: Float
    let sampleIndex: Int64
  }

  private let sampleRate: Double
  private let configuration: SpectralFluxConfiguration
  private let fftSize: Int
  private let hopSize: Int
  private let cooldownSamples: Int64
  private let historyCapacity: Int
  private let binRange: Range<Int>
  private let analyzer: RealSpectrumAnalyzer
  private var previousSpectrum: [Float]
  private var frame: [Float]
  private var buffered: [Float] = []
  private var bufferedStartSample: Int64 = 0
  private var nextFrameStart: Int64 = 0
  private var processedSamples: Int64 = 0
  private var fluxHistory: [Float] = []
  private var rmsHistory: [Float] = []
  private var pendingPeak: Peak?
  private var pendingCooldownPeak: Peak?
  private var highPassPreviousInput: Float = 0
  private var highPassPreviousOutput: Float = 0
  var onAnalysisFrame: ((SpectralFluxAnalysisFrame) -> Void)?

  init?(sampleRate: Double, configuration: SpectralFluxConfiguration = SpectralFluxConfiguration()) {
    guard sampleRate > 0 else { return nil }
    self.sampleRate = sampleRate
    self.configuration = configuration
    let scale = sampleRate / configuration.referenceSampleRate
    let desiredFFT = max(32, Int((Double(configuration.fftSize) * scale).rounded()))
    fftSize = Self.nextPowerOfTwo(desiredFFT)
    hopSize = max(1, Int((Double(configuration.hopSize) * scale).rounded()))
    cooldownSamples = Int64((configuration.cooldownMs / 1_000 * sampleRate).rounded())
    historyCapacity = max(3, Int((configuration.thresholdHistorySeconds * sampleRate / Double(hopSize)).rounded()))
    let minBin = max(1, Int((configuration.minimumFrequency * Double(fftSize) / sampleRate).rounded(.up)))
    let maxBin = min(fftSize / 2 - 1, Int((configuration.maximumFrequency * Double(fftSize) / sampleRate).rounded(.down)))
    guard minBin <= maxBin, let analyzer = RealSpectrumAnalyzer(fftSize: fftSize) else { return nil }
    binRange = minBin ..< maxBin + 1
    self.analyzer = analyzer
    previousSpectrum = Array(repeating: 0, count: fftSize / 2)
    frame = Array(repeating: 0, count: fftSize)
  }

  func process(samples: UnsafeBufferPointer<Float>) -> [OnsetEvent] {
    guard !samples.isEmpty else { return [] }
    appendHighPassed(samples)
    var events: [OnsetEvent] = []
    while nextFrameStart + Int64(fftSize) <= processedSamples {
      let offset = Int(nextFrameStart - bufferedStartSample)
      frame.withUnsafeMutableBufferPointer { destination in
        buffered.withUnsafeBufferPointer { source in
          destination.baseAddress!.update(from: source.baseAddress!.advanced(by: offset), count: fftSize)
        }
      }
      let frameStart = nextFrameStart
      let flux = calculateFlux()
      let threshold = adaptiveThreshold(including: flux)
      let frameRmsDbfs = calculateFrameRmsDbfs()
      let rmsBaselineDbfs = rmsHistory.count >= 3 ? Self.median(rmsHistory) : -.infinity
      // The frame start is the earliest causal sample position for this
      // positive spectral change. It avoids systematically reporting each
      // waveform attack one half-window late.
      onAnalysisFrame?(SpectralFluxAnalysisFrame(sampleIndex: frameStart, spectralFlux: flux, adaptiveThreshold: threshold, frameRmsDbfs: frameRmsDbfs))
      confirmPeak(flux: flux, threshold: threshold, frameRmsDbfs: frameRmsDbfs, rmsBaselineDbfs: rmsBaselineDbfs, sampleIndex: frameStart, events: &events)
      flushExpiredCooldown(at: frameStart, events: &events)
      fluxHistory.append(flux)
      rmsHistory.append(frameRmsDbfs)
      if fluxHistory.count > historyCapacity { fluxHistory.removeFirst() }
      if rmsHistory.count > historyCapacity { rmsHistory.removeFirst() }
      nextFrameStart += Int64(hopSize)
      discardConsumedSamples()
    }
    return events
  }

  func process(samples: [Float]) -> [OnsetEvent] {
    samples.withUnsafeBufferPointer { process(samples: $0) }
  }

  func finish() -> [OnsetEvent] {
    var events: [OnsetEvent] = []
    if let peak = pendingPeak, isAcceptable(peak) { queueForCooldown(peak, events: &events) }
    pendingPeak = nil
    if let peak = pendingCooldownPeak { events.append(makeEvent(peak))
      pendingCooldownPeak = nil
    }
    return events
  }

  func reset() {
    previousSpectrum = Array(repeating: 0, count: previousSpectrum.count)
    buffered.removeAll(keepingCapacity: true)
    bufferedStartSample = 0
    nextFrameStart = 0
    processedSamples = 0
    fluxHistory.removeAll(keepingCapacity: true)
    rmsHistory.removeAll(keepingCapacity: true)
    pendingPeak = nil
    pendingCooldownPeak = nil
    highPassPreviousInput = 0
    highPassPreviousOutput = 0
  }

  private func appendHighPassed(_ samples: UnsafeBufferPointer<Float>) {
    let coefficient = Float(exp(-2 * Double.pi * configuration.highPassCutoffHz / sampleRate))
    for sample in samples {
      let output = coefficient * (highPassPreviousOutput + sample - highPassPreviousInput)
      buffered.append(output)
      highPassPreviousInput = sample
      highPassPreviousOutput = output
    }
    processedSamples += Int64(samples.count)
  }

  private func calculateFlux() -> Float {
    let magnitudes = frame.withUnsafeBufferPointer { analyzer.magnitudeSpectrum(frame: $0) }
    var total: Float = 0
    if configuration.normalizeSpectrum {
      vDSP_sve(magnitudes.baseAddress!, 1, &total, vDSP_Length(magnitudes.count))
      total = max(total, Float.leastNonzeroMagnitude)
    } else { total = 1 }
    var flux: Float = 0
    for index in binRange {
      let compressed = log1pf(configuration.magnitudeCompression * magnitudes[index] / total)
      let difference = max(0, compressed - previousSpectrum[index])
      flux += configuration.useSquaredFlux ? difference * difference : difference
      previousSpectrum[index] = compressed
    }
    return flux / Float(binRange.count)
  }

  private func adaptiveThreshold(including flux: Float) -> Float {
    let values = fluxHistory + [flux]
    guard values.count >= 3 else { return max(configuration.minimumFlux, Float.greatestFiniteMagnitude) }
    let median = Self.median(values)
    let deviations = values.map { abs($0 - median) }
    return max(configuration.minimumFlux, median + configuration.thresholdMultiplier * Self.median(deviations))
  }

  private func calculateFrameRmsDbfs() -> Float {
    var rms: Float = 0
    frame.withUnsafeBufferPointer { vDSP_rmsqv($0.baseAddress!, 1, &rms, vDSP_Length(fftSize)) }
    return 20 * log10f(max(rms, 0.000_000_01))
  }

  private func confirmPeak(flux: Float, threshold: Float, frameRmsDbfs: Float, rmsBaselineDbfs: Float, sampleIndex: Int64, events: inout [OnsetEvent]) {
    defer { pendingPeak = Peak(flux: flux, threshold: threshold, frameRmsDbfs: frameRmsDbfs, rmsBaselineDbfs: rmsBaselineDbfs, sampleIndex: sampleIndex) }
    guard let candidate = pendingPeak,
          candidate.flux > flux,
          isAcceptable(candidate)
    else { return }
    queueForCooldown(candidate, events: &events)
  }

  /// A local maximum is known one hop late. Hold it through the cooldown so a
  /// stronger nearby peak can replace it before an event reaches the caller.
  private func queueForCooldown(_ peak: Peak, events: inout [OnsetEvent]) {
    guard let pending = pendingCooldownPeak else { pendingCooldownPeak = peak
      return
    }
    if peak.sampleIndex - pending.sampleIndex < cooldownSamples {
      if peak.flux > pending.flux { pendingCooldownPeak = peak }
      return
    }
    events.append(makeEvent(pending))
    pendingCooldownPeak = peak
  }

  private func flushExpiredCooldown(at sampleIndex: Int64, events: inout [OnsetEvent]) {
    guard let pending = pendingCooldownPeak, sampleIndex - pending.sampleIndex >= cooldownSamples else { return }
    events.append(makeEvent(pending))
    pendingCooldownPeak = nil
  }

  private func makeEvent(_ peak: Peak) -> OnsetEvent {
    OnsetEvent(sampleIndex: peak.sampleIndex, timestampSeconds: Double(peak.sampleIndex) / sampleRate, spectralFlux: peak.flux, adaptiveThreshold: peak.threshold, prominence: peak.flux - peak.threshold, confidence: peak.flux / max(peak.threshold, configuration.minimumFlux), frameRmsDbfs: peak.frameRmsDbfs)
  }

  private func isAcceptable(_ peak: Peak) -> Bool {
    peak.flux > peak.threshold &&
      peak.flux - peak.threshold >= configuration.minimumProminence &&
      peak.flux / max(peak.threshold, configuration.minimumFlux) >= configuration.minimumThresholdRatio &&
      (configuration.minimumRmsRiseDb == 0 || peak.frameRmsDbfs - peak.rmsBaselineDbfs >= configuration.minimumRmsRiseDb)
  }

  private func discardConsumedSamples() {
    let discardThrough = nextFrameStart
    let count = Int(discardThrough - bufferedStartSample)
    guard count > 0 else { return }
    buffered.removeFirst(min(count, buffered.count))
    bufferedStartSample = discardThrough
  }

  private static func nextPowerOfTwo(_ value: Int) -> Int {
    1 << Int(ceil(log2(Double(value))))
  }

  private static func median(_ values: [Float]) -> Float {
    let sorted = values.sorted()
    let middle = sorted.count / 2
    return sorted.count.isMultiple(of: 2) ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
  }
}
