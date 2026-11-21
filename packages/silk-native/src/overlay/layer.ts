import {
  type ComponentRef,
  type Context,
  createContext,
  type ReactNode,
  type RefObject,
} from 'react';
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
  /**
   * Web: called as it opens, before Radix's FocusScope moves focus to its
   * first Tab stop that isn't a link (or to the layer when it has none), and
   * not when something inside took focus already; `preventDefault()` keeps
   * focus where it is.
   * Native has no focus to move.
   */
  readonly onOpenAutoFocus?: ((event: OpenAutoFocusEvent) => void) | undefined;
}

/** What `onOpenAutoFocus` receives, as the web's `Event` does. */
export interface OpenAutoFocusEvent {
  preventDefault(): void;
  readonly defaultPrevented: boolean;
}

/**
 * Above the page, like `@reactive/silk`'s popover (`floatingZIndex.popover`),
 * so a body portal lands over anything the page layers below it.
 */
export const FLOATING_Z_INDEX = 40;

/**
 * Where a floating layer opened inside a Dialog goes on the web: a node inside
 * the dialog's Modal, so the layer paints above the dialog (react-native-web
 * stacks a Modal at z-index 9999, over a layer at the end of the page) and
 * stays inside its focus trap. Null outside a dialog, where the layer goes to
 * the end of the page. Native layers are Modals of their own and ignore it.
 */
export const FloatingHostContext: Context<ComponentRef<typeof View> | null> = createContext<
  ComponentRef<typeof View> | null
>(null);

/**
 * Runs `start` with the anchor's node once it is attached, and returns what
 * undoes it. An anchor rendered after the layer, or later still (behind a
 * Suspense boundary), attaches its ref after the layer's effects ran, and
 * a ref never re-renders, so it is looked for again each frame until then
 * (one frame callback each, while the layer waits).
 */
export function withAnchor<T>(
  anchor: RefObject<T | null>,
  start: (node: T) => (() => void) | void,
): () => void {
  let stop: (() => void) | void;
  let frame: number | undefined;
  const tryStart = () => {
    frame = anchor.current ? undefined : requestAnimationFrame(tryStart);
    if (anchor.current) stop = start(anchor.current);
  };
  tryStart();
  return () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    stop?.();
  };
}
