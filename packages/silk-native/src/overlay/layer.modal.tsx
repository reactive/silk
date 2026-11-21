import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type JSX,
} from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Pressable } from '../components/Pressable.js';
import type { FloatingLayerProps } from './layer.js';
import { type Box, placeFloating, type Size } from './place.js';

/**
 * The native floating layer: a transparent Modal, so it draws over everything
 * and the back button closes it. A press outside the surface closes it too,
 * and so does turning the device, which moves the anchor.
 */
export function FloatingLayer({
  anchor,
  onDismiss,
  children,
  ...options
}: FloatingLayerProps): JSX.Element {
  const screen = useWindowDimensions();
  const [anchorBox, setAnchorBox] = useState<Box>();
  const [size, setSize] = useState<Size>();
  useLayoutEffect(() => {
    anchor.current?.measureInWindow((x, y, width, height) =>
      setAnchorBox({ x, y, width, height }),
    );
  }, [anchor]);

  // The window it opened in: a new size (the device turned) moves the anchor.
  const opened = useRef(screen);
  useEffect(() => {
    if (
      screen.width !== opened.current.width ||
      screen.height !== opened.current.height
    ) {
      onDismiss();
    }
  }, [screen.width, screen.height, onDismiss]);

  const place = anchorBox && size && placeFloating(anchorBox, size, screen, options);
  return (
    <Modal transparent statusBarTranslucent visible onRequestClose={onDismiss}>
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        focusRing={false}
        onPress={onDismiss}
        style={StyleSheet.absoluteFill}
      />
      <View
        // Measured once, before it is placed; a smaller maxHeight later doesn't move it.
        onLayout={({ nativeEvent: { layout } }) =>
          setSize((measured) => measured ?? layout)
        }
        style={[
          styles.layer,
          place
            ? { left: place.left, top: place.top, maxHeight: place.maxHeight }
            : styles.unplaced,
        ]}
      >
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute' },
  unplaced: { left: 0, top: 0, opacity: 0 },
});
