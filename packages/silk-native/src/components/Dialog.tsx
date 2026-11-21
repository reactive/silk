import { dialogRecipe, type DialogVariantProps } from '@reactive/silk-core';
import {
  type ComponentRef,
  createContext,
  type JSX,
  type ReactNode,
  type Ref,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  type StyleProp,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { rnwAttrs } from '../styles/a11yProps.js';
import { useSheetDrag } from '../overlay/sheetDrag.js';
import { mapDialogStyle } from '../styles/mappers/overlay.js';
import { useMotionPreference } from '../styles/useReducedMotion.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { Heading, type HeadingProps } from './Heading.js';

interface DialogContextValue {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly titleId: string;
  /** Whether a `Dialog.Title` is rendered, so the dialog may point to it for its name. */
  readonly titled: boolean;
  readonly setTitled: (titled: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(part: string): DialogContextValue {
  const dialog = useContext(DialogContext);
  if (!dialog) throw new Error(`Dialog.${part} must be used within Dialog.Root`);
  return dialog;
}

export interface DialogRootProps {
  /** Whether it shows. Controlled: the dialog asks to close through `onOpenChange(false)`. */
  readonly open: boolean;
  /**
   * Called with `false` for a press on the veil, Escape (web), the back
   * button (Android), or a sheet (`placement="bottom"`) dragged down.
   */
  readonly onOpenChange: (open: boolean) => void;
  readonly children?: ReactNode;
}

function DialogRoot({ open, onOpenChange, children }: DialogRootProps): JSX.Element {
  const titleId = useId();
  const [titled, setTitled] = useState(false);
  const value = useMemo<DialogContextValue>(
    () => ({ open, onOpenChange, titleId, titled, setTitled }),
    [open, onOpenChange, titleId, titled],
  );
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export interface DialogContentProps
  extends DialogVariantProps, Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
  readonly children?: ReactNode;
  /** The panel's style, after Silk's. */
  readonly style?: StyleProp<ViewStyle>;
  /** The veil's style, after Silk's (`semantic.color.overlay`). */
  readonly overlayStyle?: StyleProp<ViewStyle>;
}

/**
 * The dialog's panel over a veiled screen, on React Native's Modal (which
 * react-native-web renders as an `aria-modal` dialog that traps focus, hands
 * it back on close, and closes on Escape). Centered, or risen from the bottom
 * edge as a sheet (`placement="bottom"`), which a handle at its top shows can
 * be dragged down to close: from any part that doesn't take the press itself,
 * such as a ScrollView with room to scroll. Its children lay out in the panel;
 * wrap long content in a ScrollView.
 */
function DialogContent({
  size,
  placement,
  style,
  overlayStyle,
  children,
  ref,
  ...rest
}: DialogContentProps): JSX.Element {
  const { open, onOpenChange, titleId, titled } = useDialogContext('Content');
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Dialog');
  const motionPreference = useMotionPreference();
  const resolvedPlacement = placement ?? defaults.placement ?? dialogRecipe.defaults.placement;
  const { veil, panel } = mapDialogStyle(
    theme,
    { size: size ?? defaults.size ?? dialogRecipe.defaults.size, placement: resolvedPlacement },
    density,
  );
  const close = () => onOpenChange(false);
  const drag = useSheetDrag(open, motionPreference === 'reduced', close);
  const sheet = resolvedPlacement === 'bottom';
  // Android recreates its dialog when animationType changes, so it is set
  // only while closed. Fading until the preference is known (it resolves a
  // moment after mount) keeps a dialog mounted open from losing its fade; a
  // reduced-motion user may see that one fade, before the answer arrives.
  const motion: 'none' | 'fade' = motionPreference === 'reduced' ? 'none' : 'fade';
  const [animationType, setAnimationType] = useState(motion);
  if (!open && animationType !== motion) setAnimationType(motion);
  return (
    <Modal
      visible={open}
      transparent
      statusBarTranslucent
      animationType={animationType}
      onRequestClose={close}
      {...rnwAttrs({ 'aria-labelledby': titled ? titleId : undefined })}
    >
      <View style={[veil, overlayStyle]}>
        {/*
         * A press on the veil closes it. Not a button: react-native-web's focus
         * trap focuses the first focusable element, which must be the panel's.
         */}
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onResponderRelease={close}
        />
        {sheet ? (
          <Animated.View
            // Animated.View hands its ref to the View it draws; its types name another.
            ref={ref as Ref<ComponentRef<typeof Animated.View>>}
            {...rest}
            {...drag.panHandlers}
            onLayout={(event) => {
              drag.onLayout(event);
              rest.onLayout?.(event);
            }}
            style={[
              panel,
              styles.overVeil,
              style,
              { transform: [{ translateY: drag.translateY }] },
            ]}
          >
            <View
              style={[styles.handle, { backgroundColor: theme.semantic.color.tones.neutral.border }]}
              aria-hidden
            />
            {children}
          </Animated.View>
        ) : (
          <View ref={ref} {...rest} style={[panel, styles.overVeil, style]}>
            {children}
          </View>
        )}
      </View>
    </Modal>
  );
}

export type DialogTitleProps = HeadingProps;

/** The dialog's name: a heading (level 2, size `md` unless given), and what screen readers announce for it. */
function DialogTitle({ level = '2', size = 'md', ...props }: DialogTitleProps): JSX.Element {
  const { titleId, setTitled } = useDialogContext('Title');
  useLayoutEffect(() => {
    setTitled(true);
    return () => setTitled(false);
  }, [setTitled]);
  return <Heading level={level} size={size} nativeID={titleId} {...props} />;
}

/** A sheet's drag handle: Material's 32 by 4. */
const HANDLE = { width: 32, height: 4 } as const;

const styles = StyleSheet.create({
  // The veil's press catcher is positioned, so it would cover the panel otherwise.
  overVeil: { zIndex: 1 },
  // Over the panel's padding, centered at its top.
  handle: {
    ...HANDLE,
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -HANDLE.width / 2,
    borderRadius: HANDLE.height / 2,
  },
});

export interface DialogNamespace {
  readonly Root: typeof DialogRoot;
  readonly Content: typeof DialogContent;
  readonly Title: typeof DialogTitle;
}

export const Dialog: DialogNamespace = {
  Root: DialogRoot,
  Content: DialogContent,
  Title: DialogTitle,
};
