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
