import type { ComponentRef, ReactNode, RefObject } from 'react';
import type { View } from 'react-native';
import type { PlaceOptions } from './place.js';

/**
 * What both floating layers take (`layer.modal.tsx` on native,
 * `layer.dom.tsx` on the web, chosen by the package's `#floating-layer`
 * import): a surface placed beside `anchor` while rendered.
 */
export interface FloatingLayerProps extends PlaceOptions {
  readonly anchor: RefObject<ComponentRef<typeof View> | null>;
  /** A press outside it and its anchor, Escape or the back button, scrolling that moves the anchor, a resized window. */
  readonly onDismiss: () => void;
  readonly children: ReactNode;
}

/**
 * Above the page, like `@reactive/silk`'s popover (`floatingZIndex.popover`),
 * so a body portal lands over anything the page layers below it.
 */
export const FLOATING_Z_INDEX = 40;

/**
 * Runs `start` with the anchor's node once it is attached, and returns what
 * undoes it. An anchor rendered after the layer attaches its ref after the
 * layer's layout effects, so it is tried again on the next frame.
 */
export function withAnchor<T>(
  anchor: RefObject<T | null>,
  start: (node: T) => (() => void) | void,
): () => void {
  let stop: (() => void) | void;
  const run = () => {
    if (anchor.current) stop = start(anchor.current);
  };
  const frame = anchor.current ? undefined : requestAnimationFrame(run);
  if (frame === undefined) run();
  return () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    stop?.();
  };
}
