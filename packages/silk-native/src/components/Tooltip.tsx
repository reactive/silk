import {
  type ComponentRef,
  createContext,
  type JSX,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import {
  Platform,
  type StyleProp,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
// The platform's layer: `layer.modal` on native, `layer.dom` on the web (package.json `imports`).
import { FloatingLayer } from '#floating-layer';
import type { FloatingAlign, FloatingSide } from '../overlay/place.js';
import {
  type FocusTarget,
  matchesFocusVisible,
  type WebFocusEvent,
  type WebNode,
} from '../styles/a11yProps.js';
import { mapTooltipStyle } from '../styles/mappers/overlay.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { Text } from './Text.js';
import { useControllableValue } from './useControllableValue.js';

/** How long a pointer leaving the trigger has to reach the tooltip before it closes. */
const LEAVE_GRACE_MS = 100;

interface TooltipContextValue {
  readonly open: boolean;
  readonly anchor: RefObject<ComponentRef<typeof View> | null>;
  readonly openNow: () => void;
  /** Opens it once a mouse has rested for the delay, unless something changes it first. */
  readonly openAfterDelay: () => void;
  readonly closeNow: () => void;
  /** Closes it after a pointer's moment to reach the tooltip, unless something changes it first. */
  readonly closeAfterGrace: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltip(part: string): TooltipContextValue {
  const tooltip = useContext(TooltipContext);
  if (!tooltip) throw new Error(`Tooltip.${part} must be used within Tooltip.Root`);
  return tooltip;
}

export interface TooltipRootProps {
  /** Whether it shows. Leave it out for the tooltip to keep its own state. */
  readonly open?: boolean;
  /** @default false */
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** Milliseconds a mouse rests on the trigger before it opens (web). @default 700 */
  readonly delayDuration?: number;
  readonly children?: ReactNode;
}

function TooltipRoot({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  delayDuration = 700,
  children,
}: TooltipRootProps): JSX.Element {
  const [open, setUncontrolled] = useControllableValue(openProp, defaultOpen);
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The latest, for timers that fire after a render.
  const latest = useRef({ open, setUncontrolled, onOpenChange });
  // What it asked for last, until it renders or the event ends: two closes in
  // one event (focus leaving, and the layer seeing focus go outside) ask once.
  const asked = useRef<boolean>(undefined);
  useLayoutEffect(() => {
    latest.current = { open, setUncontrolled, onOpenChange };
    asked.current = undefined;
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  // A change made now supersedes one a timer was waiting to make.
  const setOpen = useCallback((next: boolean) => {
    clearTimeout(timer.current);
    const { open: shown, setUncontrolled: set, onOpenChange: report } = latest.current;
    if (next === (asked.current ?? shown)) return;
    asked.current = next;
    setTimeout(() => {
      asked.current = undefined;
    });
    set(next);
    report?.(next);
  }, []);
  // Asking for the state it is already in cancels a pending change and schedules
  // nothing: a mouse passing over opens nothing, and one coming back keeps it open.
  const later = useCallback(
    (next: boolean, ms: number) => {
      clearTimeout(timer.current);
      if (next !== latest.current.open) timer.current = setTimeout(() => setOpen(next), ms);
    },
    [setOpen],
  );
  const actions = useMemo(
    () => ({
      openNow: () => setOpen(true),
      openAfterDelay: () => later(true, delayDuration),
      closeNow: () => setOpen(false),
      closeAfterGrace: () => later(false, LEAVE_GRACE_MS),
    }),
    [setOpen, later, delayDuration],
  );
  const value = useMemo(() => ({ open, anchor, ...actions }), [open, actions]);
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

/** The Trigger's own handlers, which open and close it. */
type WebHandlers =
  | 'onPointerEnter'
  | 'onPointerLeave'
  | 'onPointerDown'
  | 'onPointerCancel'
  | 'onFocus'
  | 'onBlur';
type TriggerHandlers = WebHandlers | 'onStartShouldSetResponder' | 'onResponderRelease';

export interface TooltipTriggerProps extends Omit<ViewProps, 'children' | TriggerHandlers> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
  readonly children?: ReactNode;
}

/**
 * A box around what the tooltip explains, which opens it: on the web, a mouse
 * resting on it for `delayDuration` or keyboard focus arriving inside it; on
 * any platform, a tap or click that nothing inside takes. A disabled control
 * takes no press, so a tap on it opens the tooltip; an enabled one keeps its
 * press. Its whole box takes the presses nothing inside takes, so in a
 * pressable row, a press there opens the tooltip instead of pressing the row.
 * It closes as the mouse leaves (with a moment to reach the tooltip), as
 * focus leaves it, and on a press outside, Escape or the back button.
 *
 * Keyboard focus can't land on a disabled control, so on the web its tooltip
 * opens only for a mouse or a tap.
 *
 * The tooltip is not read by screen readers from the trigger: give the
 * control the same words (`accessibilityHint`, or `aria-describedby` to a
 * description) so they reach everyone.
 */
function TooltipTrigger({ ref, children, ...rest }: TooltipTriggerProps): JSX.Element {
  const { anchor, openNow, openAfterDelay, closeNow, closeAfterGrace } = useTooltip('Trigger');
  // A press inside, from its start to its click: its mousedown may take focus
  // to nothing (a part that takes no focus), which mustn't close the tooltip
  // the press opens. A touch's mousedown comes only after the finger lifts.
  const pressing = useRef(false);
  const setRef = useCallback(
    (node: ComponentRef<typeof View> | null) => {
      anchor.current = node;
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
    },
    [anchor, ref],
  );
  const web: Pick<ViewProps, WebHandlers> | undefined =
    Platform.OS === 'web'
      ? {
          onPointerEnter: (event) => {
            if (event.nativeEvent.pointerType === 'mouse') openAfterDelay();
          },
          onPointerLeave: (event) => {
            if (event.nativeEvent.pointerType === 'mouse') closeAfterGrace();
          },
          // Focus from the keyboard (the browser's :focus-visible) opens it; a press's doesn't.
          onFocus: (event) => {
            if (matchesFocusVisible(event.target as unknown as FocusTarget)) openNow();
          },
          onPointerDown: () => {
            pressing.current = true;
          },
          onPointerCancel: () => {
            pressing.current = false;
          },
          // Focus moving to another control inside keeps it open, and so does a
          // press inside taking it to nothing.
          onBlur: (event) => {
            const { relatedTarget } = event.nativeEvent as unknown as WebFocusEvent;
            const box = anchor.current as unknown as WebNode | null;
            const inside = relatedTarget ? box?.contains(relatedTarget) : pressing.current;
            if (!inside) closeNow();
          },
        }
      : undefined;
  // react-native-web's onClick, which React Native's View types lack.
  const webClick =
    Platform.OS === 'web'
      ? {
          onClick: () => {
            pressing.current = false;
          },
        }
      : undefined;
  return (
    <View
      ref={setRef}
      {...rest}
      {...web}
      {...webClick}
      // Asked last, after everything inside: only a press nothing inside takes reaches it.
      onStartShouldSetResponder={() => true}
      onResponderRelease={openNow}
    >
      {children}
    </View>
  );
}

export interface TooltipContentProps
  extends Omit<ViewProps, 'children' | 'style' | 'onPointerEnter' | 'onPointerLeave'> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
  /** A string or number is set in the tooltip's text style; other children style themselves. */
  readonly children?: ReactNode;
  /** The surface's style, after Silk's. */
  readonly style?: StyleProp<ViewStyle>;
  /**
   * The trigger's side it prefers; it takes the other when it doesn't fit and
   * the other has more room.
   * @default 'top'
   */
  readonly side?: FloatingSide;
  /** @default 'center' */
  readonly align?: FloatingAlign;
  /** @default 4 */
  readonly sideOffset?: number;
  /** The least space it keeps from the window's edges. @default 8 */
  readonly collisionPadding?: number;
}

/**
 * A short line beside the trigger while open, on the floating layer
 * `Popover` uses: on the web it never takes focus and a mouse can move onto
 * it without closing it; on native it is a transparent Modal a tap anywhere
 * closes.
 */
function TooltipContent({
  side = 'top',
  align = 'center',
  sideOffset = 4,
  collisionPadding = 8,
  style,
  children,
  ref,
  ...rest
}: TooltipContentProps): JSX.Element | null {
  const { open, anchor, openNow, closeNow, closeAfterGrace } = useTooltip('Content');
  const { theme } = useTheme();
  if (!open) return null;
  const tooltip = mapTooltipStyle(theme);
  const web: Pick<ViewProps, 'onPointerEnter' | 'onPointerLeave'> | undefined =
    Platform.OS === 'web'
      ? { onPointerEnter: openNow, onPointerLeave: closeAfterGrace }
      : undefined;
  return (
    <FloatingLayer
      anchor={anchor}
      onDismiss={closeNow}
      side={side}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      <View ref={ref} role="tooltip" {...rest} {...web} style={[tooltip.surface, style]}>
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text style={tooltip.text}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </FloatingLayer>
  );
}

export interface TooltipNamespace {
  readonly Root: typeof TooltipRoot;
  readonly Trigger: typeof TooltipTrigger;
  readonly Content: typeof TooltipContent;
}

export const Tooltip: TooltipNamespace = {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
};
