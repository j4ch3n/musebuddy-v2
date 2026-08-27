const { createRunOncePlugin, withPodfile } = require('expo/config-plugins');

const pkg = require('../package.json');

const HELPER_START = '# @generated begin MuseBuddy RNAudioAPI FFmpeg linkage';
const HELPER_END = '# @generated end MuseBuddy RNAudioAPI FFmpeg linkage';
const HELPER_CALL = '    musebuddy_patch_rn_audio_api_ffmpeg_linkage(installer)';

const HELPER = `${HELPER_START}
def musebuddy_patch_rn_audio_api_ffmpeg_linkage(installer)
  ffmpeg_frameworks = %w[libavcodec libavformat libavutil libswresample]

  installer.aggregate_targets.each do |aggregate_target|
    next unless aggregate_target.name == 'Pods-MuseBuddy'

    aggregate_target.xcconfigs.each do |config_name, xcconfig|
      search_path = '"\${PODS_XCFRAMEWORKS_BUILD_DIR}/RNAudioAPI"'
      framework_search_paths = xcconfig.attributes['FRAMEWORK_SEARCH_PATHS'] || '$(inherited)'
      unless framework_search_paths.include?(search_path)
        xcconfig.attributes['FRAMEWORK_SEARCH_PATHS'] = "\#{framework_search_paths} \#{search_path}"
      end

      other_ldflags = xcconfig.attributes['OTHER_LDFLAGS'] || '$(inherited)'
      ffmpeg_frameworks.each do |framework|
        flag = %(-framework "\#{framework}")
        other_ldflags = "\#{other_ldflags} \#{flag}" unless other_ldflags.include?(flag)
      end
      xcconfig.attributes['OTHER_LDFLAGS'] = other_ldflags
      xcconfig.save_as(aggregate_target.xcconfig_path(config_name))
    end
  end

  frameworks_script = File.join(
    installer.sandbox.root.to_s,
    'Target Support Files',
    'Pods-MuseBuddy',
    'Pods-MuseBuddy-frameworks.sh'
  )
  return unless File.exist?(frameworks_script)

  contents = File.read(frameworks_script)
  ffmpeg_frameworks.each do |framework|
    install_line = %(  install_framework "\${PODS_XCFRAMEWORKS_BUILD_DIR}/RNAudioAPI/\#{framework}.framework")
    next if contents.include?(install_line)

    contents = contents.gsub(/(if \\[\\[ "\\$CONFIGURATION" == "Debug" \\]\\]; then\\n)/) { "\#{$1}\#{install_line}\\n" }
    contents = contents.gsub(/(if \\[\\[ "\\$CONFIGURATION" == "Release" \\]\\]; then\\n)/) { "\#{$1}\#{install_line}\\n" }
  end
  File.write(frameworks_script, contents)
end
${HELPER_END}`;

function removeGeneratedBlock(contents) {
  const pattern = new RegExp(
    `\\n?${escapeRegExp(HELPER_START)}[\\s\\S]*?${escapeRegExp(HELPER_END)}\\n?`,
    'm',
  );
  return contents.replace(pattern, '\n');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function withRNAudioAPIFFmpegLinkage(config) {
  return withPodfile(config, (mod) => {
    let contents = removeGeneratedBlock(mod.modResults.contents);

    if (!contents.includes(HELPER_CALL)) {
      contents = contents.replace(
        /(\s*react_native_post_install\([\s\S]*?\n\s*\))/,
        `$1\n${HELPER_CALL}`,
      );
    }

    contents = contents.replace(/\ntarget 'MuseBuddy' do/, `\n${HELPER}\n\ntarget 'MuseBuddy' do`);
    mod.modResults.contents = contents;
    return mod;
  });
}

module.exports = createRunOncePlugin(
  withRNAudioAPIFFmpegLinkage,
  'with-rn-audio-api-ffmpeg-linkage',
  pkg.version,
);
