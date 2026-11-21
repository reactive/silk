import { dialogRecipe, type DialogVariantProps } from '@reactive/silk-core';
import {
  type ComponentRef,
  type ComponentType,
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
  const { open, onOpenChange } = useDialogContext('Content');
  const motionPreference = useMotionPreference();
  const { veil, panel } = useDialogStyle({ size, placement });
  const close = () => onOpenChange(false);
  // Android recreates its dialog when animationType changes, so it is set
  // only while closed. Fading until the preference is known (it resolves a
  // moment after mount) keeps a dialog mounted open from losing its fade; a
  // reduced-motion user may see that one fade, before the answer arrives.
  const motion: 'none' | 'fade' = motionPreference === 'reduced' ? 'none' : 'fade';
  const [animationType, setAnimationType] = useState(motion);
  if (!open && animationType !== motion) setAnimationType(motion);
  return (
    <DialogShell
      visible={open}
      animationType={animationType}
      onClose={close}
      veil={[veil, overlayStyle]}
    >
      <View ref={ref} {...rest} style={[panel, dialogShellStyles.overVeil, style]}>
        {children}
      </View>
    </DialogShell>
  );
}

/**
 * @internal A dialog's variants, each from its prop, else the provider's
 * defaults, else the recipe's.
 */
export function useDialogVariants({
  size,
  placement,
}: {
  readonly size?: DialogVariantProps['size'] | undefined;
  readonly placement?: DialogVariantProps['placement'] | undefined;
}): Required<DialogVariantProps> {
  const defaults = useComponentDefaults('Dialog');
  return {
    size: size ?? defaults.size ?? dialogRecipe.defaults.size,
    placement: placement ?? defaults.placement ?? dialogRecipe.defaults.placement,
  };
}

/** @internal The veil and panel styles of a dialog's {@link useDialogVariants}. */
export function useDialogStyle(
  props: Parameters<typeof useDialogVariants>[0],
): ReturnType<typeof mapDialogStyle> {
  const { theme, density } = useTheme();
  return mapDialogStyle(theme, useDialogVariants(props), density);
}

/** @internal What a dialog's `Modal` holds around its panel; see {@link DialogShell}. */
export interface DialogShellProps {
  /** Whether the `Modal` shows: open, or (a sheet) still sliding out. */
  readonly visible: boolean;
  readonly animationType: 'none' | 'fade';
  /** Android's back, Escape (unless something inside took it), and a press on the veil. */
  readonly onClose: () => void;
  /** The veil, which lays out the panel. */
  readonly veil: StyleProp<ViewStyle>;
  /** The press catcher over the veil, behind the panel (a sheet's carries the veil's color, fading). */
  readonly catcher?: StyleProp<ViewStyle>;
  readonly Catcher?: ComponentType<ViewProps>;
  /** Wraps everything inside the `Modal` (a sheet's gestures need a root of their own there). */
  readonly Root?: ComponentType<{ readonly children: ReactNode }>;
  /** The panel, over the veil (`dialogShellStyles.overVeil`). */
  readonly children: ReactNode;
}

/**
 * @internal The part of a dialog that isn't its panel, shared by `Dialog` and
 * the `/gesture` sheet: the `Modal` named by the dialog's title, the veil and
 * its press catcher, and on the web the host the floating layers (`Popover`,
 * `Tooltip`) inside the panel open into, over it, with Escape left to a layer
 * that takes it (`useTakenEscape`).
 */
export function DialogShell({
  visible,
  animationType,
  onClose,
  veil,
  catcher,
  Catcher = View,
  Root = Bare,
  children,
}: DialogShellProps): JSX.Element {
  const { open, titleId, titled } = useDialogContext('Content');
  const takeEscape = useTakenEscape(open);
  // State, not a ref, so a layer already open inside re-renders into it once it mounts.
  const [floatingHost, setFloatingHost] = useState<ComponentRef<typeof View> | null>(null);
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType={animationType}
      onRequestClose={() => {
        if (!takeEscape()) onClose();
      }}
      {...rnwAttrs({ 'aria-labelledby': titled ? titleId : undefined })}
    >
      <Root>
        <View style={veil}>
          {/*
           * A press on the veil closes it. Not a button: react-native-web's focus
           * trap focuses the first focusable element, which must be the panel's.
           */}
          <Catcher
            style={[StyleSheet.absoluteFill, catcher]}
            onStartShouldSetResponder={() => true}
            onResponderRelease={onClose}
          />
          <FloatingHostContext.Provider value={floatingHost}>{children}</FloatingHostContext.Provider>
        </View>
        {/* After the veil, so the layers in it paint over the panel. Native layers are Modals of their own. */}
        {WEB ? (
          <View ref={setFloatingHost} pointerEvents="box-none" style={dialogShellStyles.floatingHost} />
        ) : null}
      </Root>
    </Modal>
  );
}

const Bare = ({ children }: { readonly children: ReactNode }) => <>{children}</>;

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

/** @internal */
export const dialogShellStyles: {
  readonly overVeil: ViewStyle;
  readonly floatingHost: ViewStyle;
} = StyleSheet.create({
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
