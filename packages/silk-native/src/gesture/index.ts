/**
 * @deprecated Import `Dialog` from `@reactive/silk-native`: the root entry's
 * `Dialog` is this one, bottom sheet drag included. This entry goes in the
 * next release.
 */
import type { DialogNamespace } from '../components/Dialog/Dialog.js';

export { Dialog } from '../components/Dialog/Dialog.js';
export type { SheetScrollViewProps } from '../components/Dialog/Dialog.js';
/** @deprecated The root entry's `DialogNamespace`. */
export type GestureDialog = DialogNamespace;
