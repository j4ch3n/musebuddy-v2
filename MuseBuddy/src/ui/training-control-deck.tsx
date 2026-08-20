import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type TrainingControlDeckProps = {
  abort?: ReactNode;
  primary: ReactNode;
  skip?: ReactNode;
  /** @deprecated Use skip for the middle control. */
  utility?: ReactNode;
};

/** Keeps the training controls in one compact, non-wrapping horizontal deck. */
export function TrainingControlDeck({ abort, primary, skip, utility }: TrainingControlDeckProps) {
  const secondaryControl = skip ?? utility;

  return (
    <View style={styles.deck}>
      <View style={styles.primary}>{primary}</View>
      {secondaryControl ? <View style={styles.skip}>{secondaryControl}</View> : null}
      {abort ? <View style={styles.abort}>{abort}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  abort: { minWidth: 0, width: 58 },
  deck: { alignItems: 'stretch', flexDirection: 'row', gap: 10, minHeight: 58 },
  primary: { flex: 1, minWidth: 0 },
  skip: { minWidth: 0, width: 88 },
});
