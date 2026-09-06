import { AppRegistry, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';

import tamaguiConfig from '../tamagui.config';
import { view } from './storybook.requires';

const StorybookUIRoot = view.getStorybookUI({
  shouldPersistSelection: false,
});

function StorybookRoot() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <StorybookUIRoot />
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

AppRegistry.registerComponent('main', () => StorybookRoot);

const styles = StyleSheet.create({
  root: { flex: 1 },
});
