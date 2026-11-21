/**
 * `@reactive/silk-native/gesture`: the root `Dialog`, whose bottom sheet
 * (`placement="bottom"`) follows a drag on the UI thread (Gesture Handler and
 * Reanimated worklets, no JavaScript per frame), springs with the release
 * speed, and closes when flicked or thrown past half its height (lower than
 * where the drag caught it). Its
 * `ScrollView` hands a pull-down at the content's top to the sheet. Both
 * libraries also run on react-native-web, so a phone browser drags it too.
 */
import { Dialog as RootDialog } from '../components/Dialog.js';
import { SheetContent, SheetScrollView } from './Sheet.js';
import type { GestureDialog } from './types.js';

export const Dialog: GestureDialog = {
  ...RootDialog,
  Content: SheetContent,
  ScrollView: SheetScrollView,
};
export type { GestureDialog, SheetScrollViewProps } from './types.js';
