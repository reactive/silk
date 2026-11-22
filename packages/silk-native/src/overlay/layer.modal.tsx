import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type JSX,
} from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useInText } from '../components/inText.js';
import { Pressable } from '../components/Pressable.js';
import { type FloatingLayerProps, withAnchor } from './layer.js';
import { type Box, placedStyle, placeFloating, type Size } from './place.js';

/**
 * The native floating layer: a transparent Modal, so it draws over everything
 * and the back button closes it. A press outside the surface closes it too,
 * and so does turning the device, which moves the anchor. That press ends
 * there: the views under the layer never see it, so neither do the handlers
 * around it in the tree, which on the web it would never reach.
 */
export function FloatingLayer({
  anchor,
  anchorBox: given,
  onDismiss,
  children,
  ...options
}: FloatingLayerProps): JSX.Element {
  const screen = useWindowDimensions();
  const inText = useInText();
  const [anchorBox, setAnchorBox] = useState<Box>();
  // Its size before it was placed picks the side; its size now (content
  // loading in, or shrunk to the room) places it on that side.
  const [natural, setNatural] = useState<Size>();
  const [size, setSize] = useState<Size>();
  // The room it is placed in: the Modal's own, which starts where
  // measureInWindow's coordinates do (under the status bar unless the app is
  // edge-to-edge, which then lays the Modal out from the screen's top too).
  const [room, setRoom] = useState<Size>();
  useLayoutEffect(() => {
    if (given) {
      setAnchorBox(given);
      return;
    }
    return withAnchor(anchor, (view) =>
      view.measureInWindow((x, y, width, height) => setAnchorBox({ x, y, width, height })),
    );
  }, [anchor, given]);

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

  const side = room && anchorBox && natural && placeFloating(anchorBox, natural, room, options).side;
  const place = side && size && placeFloating(anchorBox, size, room, { ...options, side });
  const layer = (
    <Modal transparent visible onRequestClose={onDismiss}>
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        focusRing={false}
        onPress={onDismiss}
        onPointerDown={endHere}
        onPointerUp={endHere}
        onLayout={({ nativeEvent: { layout } }) =>
          setRoom((was) =>
            was?.width === layout.width && was.height === layout.height
              ? was
              : { width: layout.width, height: layout.height },
          )
        }
        style={StyleSheet.absoluteFill}
      />
      <View
        onLayout={({ nativeEvent: { layout } }) => {
          const now = { width: layout.width, height: layout.height };
          setNatural((was) => was ?? now);
          setSize((was) => (was?.width === now.width && was.height === now.height ? was : now));
        }}
        style={[
          styles.layer,
          place ? placedStyle(place) : styles.unplaced,
        ]}
      >
        {children}
      </View>
    </Modal>
  );
  // Inside a line of text, a Modal would be laid out as a box in the line
  // (as big as the screen), so it goes in a box that takes no room there.
  return inText ? (
    <View collapsable={false} style={styles.inline}>
      {layer}
    </View>
  ) : (
    layer
  );
}

/** Ends a pointer event where it is, so the views under the layer don't see it. */
function endHere(event: { stopPropagation: () => void }): void {
  event.stopPropagation();
}

const styles = StyleSheet.create({
  layer: { position: 'absolute' },
  unplaced: { left: 0, top: 0, opacity: 0 },
  inline: { width: 0, height: 0 },
});
