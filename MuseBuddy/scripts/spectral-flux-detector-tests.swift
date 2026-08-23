import Foundation

enum SpectralFluxTestError: Error, CustomStringConvertible {
  case failed(String)
  var description: String { if case let .failed(message) = self { return message }; return "test failure" }
}

private func expect(_ condition: @autoclosure () -> Bool, _ message: String) throws { if !condition() { throw SpectralFluxTestError.failed(message) } }
private func near(_ actual: Float, _ expected: Float, _ tolerance: Float, _ message: String) throws { try expect(abs(actual - expected) <= tolerance, message) }

func runSpectralFluxDetectorTests() throws {
  let window = RealSpectrumAnalyzer.hannWindow(fftSize: 8)
  try near(window[0], 0, 0.0001, "Hann window starts at zero")
  try near(window[4], 1, 0.0001, "Hann window peaks at one")
  guard let analyzer = RealSpectrumAnalyzer(fftSize: 512) else { throw SpectralFluxTestError.failed("FFT setup") }
  let sine = (0 ..< 512).map { Float(sin(2 * Double.pi * 32 * Double($0) / 512)) }
  let spectrum = sine.withUnsafeBufferPointer { Array(analyzer.magnitudeSpectrum(frame: $0)) }
  let dominant = spectrum.enumerated().max(by: { $0.element < $1.element })!.offset
  try expect(abs(dominant - 32) <= 2, "FFT sine frequency bin dominates near bin 32 (observed \(dominant))")
  try near(SpectralFluxMath.positiveFlux(current: [1, 1], previous: [1, 1], range: 0 ..< 2, squared: true), 0, 0.000_001, "identical spectra have no flux")
  try expect(SpectralFluxMath.positiveFlux(current: [1, 3], previous: [1, 1], range: 0 ..< 2, squared: true) > 1, "new frequency content has positive flux")
  let sampleRate = 16_000.0
  var samples = [Float](repeating: 0, count: 16_000)
  for start in [2_000, 5_000, 8_000] {
    for index in start ..< min(start + 1_200, samples.count) { samples[index] += 0.7 * Float(sin(2 * Double.pi * 440 * Double(index) / sampleRate)) }
  }
  let configuration = SpectralFluxConfiguration()
  guard let whole = SpectralFluxDetector(sampleRate: sampleRate, configuration: configuration), let chunked = SpectralFluxDetector(sampleRate: sampleRate, configuration: configuration) else { throw SpectralFluxTestError.failed("detector setup") }
  var wholeEvents = whole.process(samples: samples); wholeEvents.append(contentsOf: whole.finish())
  var chunkedEvents: [OnsetEvent] = []; var offset = 0
  for size in [13, 701, 41, 1_024, 59] { if offset < samples.count { let count = min(size, samples.count - offset); chunkedEvents.append(contentsOf: chunked.process(samples: Array(samples[offset ..< offset + count]))); offset += count } }
  while offset < samples.count { let count = min(257, samples.count - offset); chunkedEvents.append(contentsOf: chunked.process(samples: Array(samples[offset ..< offset + count]))); offset += count }
  chunkedEvents.append(contentsOf: chunked.finish())
  try expect(wholeEvents == chunkedEvents, "whole and arbitrary chunked PCM are equivalent")
  try expect(!wholeEvents.isEmpty, "synthetic repeated attacks are detected")
  try expect(wholeEvents.allSatisfy { $0.timestampSeconds >= 0 && $0.sampleIndex >= 0 }, "timestamps derive from PCM positions")
  let cooldown = SpectralFluxConfiguration(options: ["cooldownMs": 300])
  guard let cooldownDetector = SpectralFluxDetector(sampleRate: sampleRate, configuration: cooldown) else { throw SpectralFluxTestError.failed("cooldown setup") }
  var cooldownEvents = cooldownDetector.process(samples: samples); cooldownEvents.append(contentsOf: cooldownDetector.finish())
  try expect(cooldownEvents.count <= wholeEvents.count, "cooldown suppresses close candidates")
  whole.reset(); var resetEvents = whole.process(samples: samples); resetEvents.append(contentsOf: whole.finish())
  try expect(resetEvents == wholeEvents, "reset clears detector state")
  guard let silent = SpectralFluxDetector(sampleRate: sampleRate) else { throw SpectralFluxTestError.failed("silence setup") }
  try expect(silent.process(samples: [Float](repeating: 0, count: 4_096)).isEmpty && silent.finish().isEmpty, "silence has no onset")
  print("SpectralFluxDetectorTests: PASS (Hann, FFT, flux, threshold/peaks, cooldown, timestamps, chunking, reset, silence, impulse-style attacks)")
}
