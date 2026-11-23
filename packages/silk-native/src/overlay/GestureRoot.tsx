import type { JSX, ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * Wraps what a `Modal` holds. A Modal is a window of its own on Android, so
 * the gestures inside it (a sheet's drag, a `Slider`'s) need a root of their
 * own there.
 */
export function GestureRoot({ children }: { readonly children: ReactNode }): JSX.Element {
  return <GestureHandlerRootView style={styles.fill}>{children}</GestureHandlerRootView>;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
