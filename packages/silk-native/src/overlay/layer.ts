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
 * undoes it. An anchor rendered after the layer, or later still (behind a
 * Suspense boundary), attaches its ref after the layer's effects ran, and
 * a ref never re-renders, so it is looked for again each frame until then.
 */
export function withAnchor<T>(
  anchor: RefObject<T | null>,
  start: (node: T) => (() => void) | void,
): () => void {
  let stop: (() => void) | void;
  let frame: number | undefined;
  const tryStart = () => {
    if (anchor.current) stop = start(anchor.current);
    else frame = requestAnimationFrame(tryStart);
  };
  tryStart();
  return () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    stop?.();
  };
}
