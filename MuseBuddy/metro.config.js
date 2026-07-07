const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const isStorybookEnabled = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true';

if (isStorybookEnabled) {
  const { withStorybook } = require('@storybook/react-native/metro/withStorybook');

  module.exports = withStorybook(config, {
    enabled: true,
    configPath: './.rnstorybook',
  });
} else {
  module.exports = config;
}
