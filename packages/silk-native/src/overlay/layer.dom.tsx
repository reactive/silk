/// <reference lib="dom" />
import { DismissableLayer } from '@radix-ui/react-dismissable-layer';
import { FocusScope } from '@radix-ui/react-focus-scope';
import {
  type ComponentRef,
  type CSSProperties,
  type JSX,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import type { View } from 'react-native';
import { FLOATING_Z_INDEX, type FloatingLayerProps, withAnchor } from './layer.js';
import { type FloatingSide, type Placement, placeFloating, placedStyle } from './place.js';

/**
 * The web's floating layer (react-native-web): a non-modal layer in a portal
 * at the end of the page, so no box around the anchor clips it and the page
 * stays live under it (a pointer can still hover the anchor). Radix's
 * DismissableLayer closes it on a press or focus outside it and its anchor
 * and on Escape (the topmost layer only; it listens in the capture phase,
 * so a control inside sees Escape after it), and Radix's FocusScope (untrapped) moves focus in as it opens
 * unless `onOpenAutoFocus` prevents it. Silk adds closing on scrolling that
 * moves the anchor and on resizing the window, and hands focus back to the
 * anchor (not to what held focus before) when it closes holding focus.
 */
export function FloatingLayer({
  anchor,
  onDismiss,
  children,
  side,
  align,
  sideOffset,
  collisionPadding,
  onOpenAutoFocus,
}: FloatingLayerProps): JSX.Element | null {
  const layer = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Placement>();
  // False on a server and while hydrating, which have no page to portal into.
  // The effects below depend on it to run once the layer exists.
  const client = useSyncExternalStore(subscribeNever, onClient, onServer);
  const anchorElement = () => (anchor.current ? element(anchor.current) : null);
  // The latest, so the page listeners below stay put while it is open.
  const dismiss = useRef(onDismiss);
  useLayoutEffect(() => {
    dismiss.current = onDismiss;
  });

  // Placed beside the anchor, and again as its size changes (content
  // loading in), on the side it took first so a smaller height can't flip it.
  useLayoutEffect(() => {
    const self = layer.current;
    if (!self) return;
    return withAnchor(anchor, (view) => {
      const from = element(view);
      let taken: FloatingSide | undefined;
      const placeNow = () => {
        const { left, top, width, height } = from.getBoundingClientRect();
        const next = placeFloating(
          { x: left, y: top, width, height },
          self.getBoundingClientRect(),
          { width: document.documentElement.clientWidth, height: window.innerHeight },
          { side: taken ?? side, align, sideOffset, collisionPadding },
        );
        taken = next.side;
        setPlace((was) => (was && samePlacement(was, next) ? was : next));
      };
      placeNow();
      // jsdom has none.
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(placeNow);
      observer.observe(self);
      return () => observer.disconnect();
    });
  }, [client, anchor, side, align, sideOffset, collisionPadding]);

  useLayoutEffect(() => {
    const self = layer.current;
    return () => {
      // Runs as it closes, before it leaves the page, so focus inside it is still there to see.
      if (self?.contains(document.activeElement)) anchorElement()?.focus();
    };
  }, [client, anchor]);

  useEffect(
    () =>
      withAnchor(anchor, (view) => {
        const from = element(view);
        // Scrolling that moves the anchor would leave the layer behind; a list
        // elsewhere (or inside the layer) scrolling itself, or the page scrolling
        // under a fixed anchor, doesn't.
        const opened = from.getBoundingClientRect();
        const onScroll = (event: Event) => {
          // Only a scroll of something around the anchor can move it.
          if (event.target instanceof Node && !event.target.contains(from)) return;
          const now = from.getBoundingClientRect();
          if (now.top !== opened.top || now.left !== opened.left) dismiss.current();
        };
        const onResize = () => dismiss.current();
        document.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        return () => {
          document.removeEventListener('scroll', onScroll, true);
          window.removeEventListener('resize', onResize);
        };
      }),
    [anchor],
  );

  const revealFocus = () => {
    const focused = document.activeElement;
    if (focused !== layer.current && layer.current?.contains(focused)) {
      focused?.scrollIntoView?.({ block: 'nearest' });
    }
  };

  /** Whether `target` is in the anchor, whose own press toggles the layer. */
  const onAnchor = (target: EventTarget | null) =>
    target instanceof Node && Boolean(anchorElement()?.contains(target));

  if (!client) return null;
  return createPortal(
    <FocusScope
      asChild
      onMountAutoFocus={(event) => {
        onOpenAutoFocus?.(event);
        // FocusScope focuses without scrolling; bring a chosen item below a
        // list's fold into view once it has.
        if (!event.defaultPrevented) queueMicrotask(revealFocus);
      }}
      // Silk hands focus back to the anchor instead (the layout effect's cleanup).
      onUnmountAutoFocus={(event) => event.preventDefault()}
    >
      <DismissableLayer
        ref={layer}
        onPointerDownOutside={(event) => {
          if (onAnchor(event.target)) event.preventDefault();
        }}
        onFocusOutside={(event) => {
          if (onAnchor(event.target)) event.preventDefault();
        }}
        onDismiss={onDismiss}
        style={{ ...styles.layer, ...(place ? placedStyle(place) : styles.unplaced) }}
      >
        {children}
      </DismissableLayer>
    </FocusScope>,
    document.body,
  );
}

const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;

const samePlacement = (a: Placement, b: Placement) =>
  a.left === b.left &&
  a.top === b.top &&
  a.width === b.width &&
  a.maxWidth === b.maxWidth &&
  a.maxHeight === b.maxHeight &&
  a.side === b.side;

/** React Native Web's View refs are the DOM elements themselves. */
const element = (view: ComponentRef<typeof View>) => view as unknown as HTMLElement;

const styles = {
  // A column, so the surface inside shrinks to maxHeight and its list scrolls.
  // Its own width, not what's left right of `left`, so moving it doesn't change it.
  layer: {
    position: 'fixed',
    width: 'max-content',
    // Focused only when nothing inside can be; its surface shows where it is.
    outline: 'none',
    zIndex: FLOATING_Z_INDEX,
    display: 'flex',
    flexDirection: 'column',
  },
  // Measured where it can grow to its full height, unseen but focusable, then placed.
  unplaced: { left: 0, top: 0, opacity: 0, pointerEvents: 'none' },
} satisfies Record<string, CSSProperties>;
