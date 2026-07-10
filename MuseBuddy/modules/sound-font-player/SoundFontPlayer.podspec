require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))

Pod::Spec.new do |s|
  s.name           = "SoundFontPlayer"
  s.version        = package["version"]
  s.summary        = "SoundFont playback for MuseBuddy practice sessions."
  s.description    = "An iOS-only local Expo module for playing bundled SoundFont instruments with AVAudioUnitSampler."
  s.author         = "MuseBuddy"
  s.homepage       = "https://docs.expo.dev/modules/"
  s.platforms      = { :ios => "15.1" }
  s.swift_version  = "5.9"
  s.source         = { :path => "." }
  s.static_framework = true

  s.dependency "ExpoModulesCore"

  s.source_files = "ios/**/*.swift"
  s.resources = ["ios/Resources/*.sf2"]
end
