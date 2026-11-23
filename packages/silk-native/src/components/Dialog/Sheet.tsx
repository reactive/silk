import { type ComponentRef, type JSX, type Ref, use } from 'react';
import {
  type LayoutChangeEvent,
  ScrollView as RNScrollView,
  type ScrollViewProps,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { GestureDetector, ScrollView as GHScrollView } from 'react-native-gesture-handler';
import Animated, { useScrollOffset } from 'react-native-reanimated';
import { assignRef } from '../assignRef.js';
import {
  type DialogContentProps,
  DialogShell,
  dialogShellStyles,
  BaseDialog,
  useDialogContext,
  useDialogStyle,
  useDialogVariants,
} from './BaseDialog.js';
import { mapSheetHandleStyle } from '../../styles/mappers/overlay.js';
import { useMotionPreference } from '../../styles/useReducedMotion.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import { type SheetScrollLink, SheetScrollContext, useSheetDrag } from './useSheetDrag.js';

/**
 * `Dialog.Content`: a bottom sheet drags (below); any other placement is the
 * base dialog's.
 */
export function SheetContent(props: DialogContentProps): JSX.Element {
  const { placement } = useDialogVariants(props);
  if (placement === 'bottom') return <DraggableSheet {...props} />;
  // A centered dialog opened from a sheet scrolls on its own, not as the sheet's content.
  return (
    <SheetScrollContext value={null}>
      <BaseDialog.Content {...props} />
    </SheetScrollContext>
  );
}

/** The bottom sheet: the base dialog's shell around a panel that drags ({@link useSheetDrag}). */
function DraggableSheet({
  size,
  // Taken out of `rest` so the panel's view never gets it; SheetContent already chose bottom.
  placement: _placement,
  style,
  overlayStyle,
  children,
  ref,
  onLayout,
  ...rest
}: DialogContentProps): JSX.Element {
  const { open, onOpenChange } = useDialogContext('Content');
  const { veil, panel } = useDialogStyle({ size, placement: 'bottom' });
  const { theme } = useTheme();
  // Slides until reduced motion is known, as the base dialog fades until then.
  const reduced = useMotionPreference() === 'reduced';
  const sheet = useSheetDrag({ open, onOpenChange, reduced });

  return (
    <DialogShell
      visible={sheet.presented}
      animationType="none"
      onClose={sheet.requestClose}
      veil={[veil, overlayStyle, styles.clearVeil]}
      // Its Catcher is an Animated.View, which takes the animated style the shell's type doesn't name.
      catcher={[veil, overlayStyle, sheet.veilMotion as unknown as ViewStyle]}
      Catcher={Animated.View}
    >
      <GestureDetector gesture={sheet.pan}>
        <Animated.View
          ref={ref}
          {...rest}
          onLayout={(event: LayoutChangeEvent) => {
            sheet.onPanelLayout(event);
            onLayout?.(event);
          }}
          style={[panel, dialogShellStyles.overVeil, style, sheet.panelMotion]}
        >
          <View aria-hidden style={mapSheetHandleStyle(theme)} />
          <SheetScrollContext value={sheet.scrollLink}>{children}</SheetScrollContext>
        </Animated.View>
      </GestureDetector>
    </DialogShell>
  );
}

export interface SheetScrollViewProps extends ScrollViewProps {
  readonly ref?: Ref<ComponentRef<typeof RNScrollView>>;
}

const AnimatedScrollView = Animated.createAnimatedComponent(GHScrollView);

/**
 * `Dialog.ScrollView`: in a bottom sheet, the sheet's scrolling content,
 * which hands a pull-down at its top to the sheet's drag (one per sheet).
 * Elsewhere, React Native's ScrollView.
 */
export function SheetScrollView(props: SheetScrollViewProps): JSX.Element {
  const sheet = use(SheetScrollContext);
  return sheet ? <SheetScroll sheet={sheet} {...props} /> : <RNScrollView {...props} />;
}

function SheetScroll({
  sheet,
  ref,
  ...props
}: SheetScrollViewProps & { readonly sheet: SheetScrollLink }) {
  useScrollOffset(sheet.scrollRef, sheet.scrollY);
  return (
    <AnimatedScrollView
      ref={(node: ComponentRef<typeof RNScrollView> | null) => {
        sheet.scrollRef(node);
        assignRef(ref, node);
      }}
      simultaneousWith={sheet.pan}
      overScrollMode="never"
      bounces={false}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  // The veil lays out the panel, with the caller's overlayStyle; its color
  // fades with the sheet's offset, on the press catcher.
  clearVeil: { backgroundColor: 'transparent' },
});
