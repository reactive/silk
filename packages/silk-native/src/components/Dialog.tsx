import { dialogRecipe, type DialogVariantProps } from '@reactive/silk-core';
import {
  type ComponentRef,
  createContext,
  type JSX,
  type ReactNode,
  type Ref,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  type StyleProp,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { FLOATING_Z_INDEX, FloatingHostContext } from '../overlay/layer.js';
import { rnwAttrs } from '../styles/a11yProps.js';
import { mapDialogStyle } from '../styles/mappers/overlay.js';
import { useMotionPreference } from '../styles/useReducedMotion.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { WEB, webDocument, type WebKeyEvent } from '../web/host.js';
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

/** The dialog's state, for its parts here and in the `/gesture` entry (not exported from the package). */
export function useDialogContext(part: string): DialogContextValue {
  const dialog = useContext(DialogContext);
  if (!dialog) throw new Error(`Dialog.${part} must be used within Dialog.Root`);
  return dialog;
}

export interface DialogRootProps {
  /** Whether it shows. Controlled: the dialog asks to close through `onOpenChange(false)`. */
  readonly open: boolean;
  /**
   * Called with `false` for a press on the veil, Escape (web), or the back
   * button (Android).
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
 * edge as a sheet (`placement="bottom"`). Its children lay out in the panel;
 * wrap long content in a ScrollView. On the web, a popover or tooltip opened
 * inside it opens over it (`FloatingHostContext`), and an Escape something
 * inside takes (prevents) closes that, not the dialog (`useTakenEscape`).
 * For a sheet that drags down to close, import `Dialog` from
 * `@reactive/silk-native/gesture` instead.
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
  const { veil, panel } = mapDialogStyle(
    theme,
    {
      size: size ?? defaults.size ?? dialogRecipe.defaults.size,
      placement: placement ?? defaults.placement ?? dialogRecipe.defaults.placement,
    },
    density,
  );
  const close = () => onOpenChange(false);
  const takeEscape = useTakenEscape(open);
  // Android recreates its dialog when animationType changes, so it is set
  // only while closed. Fading until the preference is known (it resolves a
  // moment after mount) keeps a dialog mounted open from losing its fade; a
  // reduced-motion user may see that one fade, before the answer arrives.
  const motion: 'none' | 'fade' = motionPreference === 'reduced' ? 'none' : 'fade';
  const [animationType, setAnimationType] = useState(motion);
  if (!open && animationType !== motion) setAnimationType(motion);
  // State, not a ref, so a layer already open inside re-renders into it once it mounts.
  const [floatingHost, setFloatingHost] = useState<ComponentRef<typeof View> | null>(null);
  return (
    <Modal
      visible={open}
      transparent
      statusBarTranslucent
      animationType={animationType}
      onRequestClose={() => {
        if (!takeEscape()) close();
      }}
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
        <View ref={ref} {...rest} style={[panel, styles.overVeil, style]}>
          <FloatingHostContext.Provider value={floatingHost}>{children}</FloatingHostContext.Provider>
        </View>
      </View>
      {/* After the veil, so the layers in it paint over the panel. Native layers are Modals of their own. */}
      {WEB ? (
        <View ref={setFloatingHost} pointerEvents="box-none" style={styles.floatingHost} />
      ) : null}
    </Modal>
  );
}

/**
 * Answers, once, whether the Escape that react-native-web's Modal is closing
 * on (at its keyup) was taken by something inside: a popover or tooltip
 * closes on the keydown and prevents it. The Modal hands `onRequestClose` no
 * event, so the dialog remembers the keydown while open, and forgets it once
 * asked, so a later keyup the page saw no keydown for still closes it. A held
 * key's repeats come after the layer has closed, so the first press decides.
 * Always false on native, where `onRequestClose` is the back button.
 */
function useTakenEscape(open: boolean): () => boolean {
  const escape = useRef<WebKeyEvent | null>(null);
  useEffect(() => {
    const page = WEB && open ? webDocument() : undefined;
    if (!page) return;
    const remember = (event: WebKeyEvent) => {
      if (event.key === 'Escape' && !event.repeat) escape.current = event;
    };
    page.addEventListener('keydown', remember, true);
    return () => {
      page.removeEventListener('keydown', remember, true);
      escape.current = null;
    };
  }, [open]);
  return () => {
    const taken = escape.current?.defaultPrevented ?? false;
    escape.current = null;
    return taken;
  };
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

const styles = StyleSheet.create({
  // The veil's press catcher is positioned, so it would cover the panel otherwise.
  overVeil: { zIndex: 1 },
  // Takes no room and no presses; the layers in it are fixed to the window.
  // Each View is a stacking context, so the host itself must sit over the veil.
  floatingHost: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    zIndex: FLOATING_Z_INDEX,
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
