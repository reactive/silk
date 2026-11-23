/**
 * `Dialog`: a modal panel, centered or as a bottom sheet (`placement="bottom"`).
 * The sheet follows a drag on the UI thread (Gesture Handler and Reanimated
 * worklets, no JavaScript per frame), springs on the theme's `motion.smooth`
 * with the release speed, and closes when flicked or thrown past half its
 * height (lower than where the drag caught it). Its `ScrollView` hands a
 * pull-down at the content's top to the sheet. Both libraries also run on
 * react-native-web, so a phone browser drags it too.
 */
import type { ComponentType } from 'react';
import { BaseDialog, type BaseDialogNamespace } from './BaseDialog.js';
import { SheetContent, SheetScrollView, type SheetScrollViewProps } from './Sheet.js';

/**
 * The dialog's parts, and `ScrollView` for a sheet's content (one per sheet),
 * which hands a pull-down at its top to the sheet.
 */
export interface DialogNamespace extends BaseDialogNamespace {
  readonly ScrollView: ComponentType<SheetScrollViewProps>;
}

export const Dialog: DialogNamespace = {
  ...BaseDialog,
  Content: SheetContent,
  ScrollView: SheetScrollView,
};

export type { DialogContentProps, DialogRootProps, DialogTitleProps } from './BaseDialog.js';
export type { SheetScrollViewProps } from './Sheet.js';
