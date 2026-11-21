/// <reference lib="dom" />
import { DismissableLayer } from '@radix-ui/react-dismissable-layer';
import {
  type ComponentRef,
  type CSSProperties,
  type JSX,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { View } from 'react-native';
import { FLOATING_Z_INDEX, type FloatingLayerProps } from './layer.js';
import { type Placement, placeFloating } from './place.js';

/**
 * The web's floating layer (react-native-web): a non-modal layer in a portal
 * at the end of the page, so no box around the anchor clips it and the page
 * stays live under it (a pointer can still hover the anchor). Radix's
 * DismissableLayer closes it on a press or focus outside it and its anchor
 * and on Escape (the topmost layer only, and not an Escape another control
 * took). Silk adds closing on scrolling that moves the anchor and on resizing
 * the window, and hands focus back to the anchor when it closes holding focus.
 */
export function FloatingLayer({
  anchor,
  onDismiss,
  children,
  ...options
}: FloatingLayerProps): JSX.Element {
  const layer = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Placement>();
  const { side, align, sideOffset, collisionPadding } = options;

  useLayoutEffect(() => {
    const from = element(anchor.current);
    const self = layer.current;
    if (!from || !self) return;
    const { left, top, width, height } = from.getBoundingClientRect();
    const size = self.getBoundingClientRect();
    setPlace(
      placeFloating(
        { x: left, y: top, width, height },
        size,
        { width: document.documentElement.clientWidth, height: window.innerHeight },
        { side, align, sideOffset, collisionPadding },
      ),
    );
    return () => {
      // Runs before the layer leaves the page, so focus inside it is still there to see.
      if (self.contains(document.activeElement)) from.focus();
    };
  }, [anchor, side, align, sideOffset, collisionPadding]);

  useEffect(() => {
    // Scrolling that moves the anchor, which would leave the layer behind;
    // not a list elsewhere (or inside the layer) scrolling itself.
    const onScroll = ({ target }: Event) => {
      const from = element(anchor.current);
      if (target === document || (target instanceof Node && target.contains(from))) {
        onDismiss();
      }
    };
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onDismiss);
    return () => {
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onDismiss);
    };
  }, [anchor, onDismiss]);

  /** Whether `target` is in the anchor, whose own press toggles the layer. */
  const onAnchor = (target: EventTarget | null) =>
    target instanceof Node && Boolean(element(anchor.current)?.contains(target));

  return createPortal(
    <DismissableLayer
      ref={layer}
      onPointerDownOutside={(event) => {
        if (onAnchor(event.target)) event.preventDefault();
      }}
      onFocusOutside={(event) => {
        if (onAnchor(event.target)) event.preventDefault();
      }}
      onDismiss={onDismiss}
      style={
        place
          ? { ...styles.layer, left: place.left, top: place.top, maxHeight: place.maxHeight }
          : { ...styles.layer, ...styles.unplaced }
      }
    >
      {children}
    </DismissableLayer>,
    document.body,
  );
}

/** React Native Web's View refs are the DOM elements themselves. */
const element = (view: ComponentRef<typeof View> | null) => view as unknown as HTMLElement | null;

const styles = {
  // A column, so the surface inside shrinks to maxHeight and its list scrolls.
  layer: {
    position: 'fixed',
    zIndex: FLOATING_Z_INDEX,
    display: 'flex',
    flexDirection: 'column',
  },
  // Measured where it can grow to its full height, unseen but focusable, then placed.
  unplaced: { left: 0, top: 0, opacity: 0, pointerEvents: 'none' },
} satisfies Record<string, CSSProperties>;
