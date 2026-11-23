import type { ComponentRef, ComponentType, Ref } from 'react';
import type { ScrollView, ScrollViewProps } from 'react-native';
import type { DialogNamespace } from '../components/Dialog.js';

export interface SheetScrollViewProps extends ScrollViewProps {
  readonly ref?: Ref<ComponentRef<typeof ScrollView>>;
}

/**
 * The package's `Dialog`: the base `Dialog`'s parts, whose bottom
 * sheet drags on native, and `ScrollView` for a sheet's content (one per
 * sheet), which hands a pull-down at its top to the sheet.
 */
export interface GestureDialog extends DialogNamespace {
  readonly ScrollView: ComponentType<SheetScrollViewProps>;
}
