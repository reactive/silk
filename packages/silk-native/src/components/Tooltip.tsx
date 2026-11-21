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
  type GestureResponderEvent,
  Platform,
  type StyleProp,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
// The platform's layer: `layer.modal` on native, `layer.dom` on the web (package.json `imports`).
import { FloatingLayer } from '#floating-layer';
import type { FloatingAlign, FloatingSide } from '../overlay/place.js';
import { mapTooltipStyle } from '../styles/mappers/overlay.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { Text } from './Text.js';
import { useControllableValue } from './useControllableValue.js';

/** How long a pointer leaving the trigger has to reach the tooltip before it closes. */
const LEAVE_GRACE_MS = 100;

interface TooltipContextValue {
  readonly open: boolean;
  readonly anchor: RefObject<ComponentRef<typeof View> | null>;
  /** Opens it now, or after the hover delay. */
  readonly show: (afterDelay: boolean) => void;
  /** Closes it now, or after a pointer's grace to reach the tooltip. */
  readonly hide: (afterGrace: boolean) => void;
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
  useLayoutEffect(() => {
    latest.current = { open, setUncontrolled, onOpenChange };
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  const setOpen = useCallback((next: boolean) => {
    clearTimeout(timer.current);
    const { open: was, setUncontrolled: set, onOpenChange: report } = latest.current;
    if (next === was) return;
    set(next);
    report?.(next);
  }, []);
  const later = useCallback(
    (next: boolean, ms: number) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setOpen(next), ms);
    },
    [setOpen],
  );
  const show = useCallback(
    (afterDelay: boolean) => {
      if (afterDelay && !latest.current.open) later(true, delayDuration);
      else setOpen(true);
    },
    [later, setOpen, delayDuration],
  );
  const hide = useCallback(
    (afterGrace: boolean) => {
      if (afterGrace && latest.current.open) later(false, LEAVE_GRACE_MS);
      else setOpen(false);
    },
    [later, setOpen],
  );
  const value = useMemo(() => ({ open, anchor, show, hide }), [open, show, hide]);
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

export interface TooltipTriggerProps extends Omit<ViewProps, 'children'> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
  readonly children?: ReactNode;
}

/** A web pointer or focus event as react-native-web hands it to a View. */
interface WebPointerEvent {
  readonly nativeEvent: { readonly pointerType?: string };
}
/** react-native-web's pointer and focus props, which React Native's View types lack. */
interface WebTriggerProps {
  onPointerEnter(event: WebPointerEvent): void;
  onPointerLeave(event: WebPointerEvent): void;
  onPointerDown(): void;
  onFocus(): void;
  onBlur(): void;
}

/**
 * A box around what the tooltip explains, which opens it: on the web, a mouse
 * resting on it for `delayDuration` or keyboard focus arriving inside it; on
 * any platform, a tap or click that nothing inside takes. A disabled control
 * takes no press, so a tap on it opens the tooltip; an enabled one keeps its
 * press. It closes as the mouse leaves (with a moment to reach the tooltip),
 * as focus leaves, and on a press outside, Escape or the back button.
 *
 * The tooltip is not read by screen readers from the trigger: give the
 * control the same words (`accessibilityHint`, or `aria-describedby` to a
 * description) so they reach everyone.
 */
function TooltipTrigger({ ref, children, ...rest }: TooltipTriggerProps): JSX.Element {
  const { anchor, show, hide } = useTooltip('Trigger');
  // A press focuses what it lands on; only focus from the keyboard opens it.
  const pressing = useRef(false);
  const setRef = useCallback(
    (node: ComponentRef<typeof View> | null) => {
      anchor.current = node;
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
    },
    [anchor, ref],
  );
  const web: WebTriggerProps | undefined =
    Platform.OS === 'web'
      ? {
          onPointerEnter: (event) => {
            if (event.nativeEvent.pointerType === 'mouse') show(true);
          },
          onPointerLeave: (event) => {
            if (event.nativeEvent.pointerType === 'mouse') hide(true);
          },
          onPointerDown: () => {
            pressing.current = true;
            setTimeout(() => {
              pressing.current = false;
            });
          },
          onFocus: () => {
            if (!pressing.current) show(false);
          },
          onBlur: () => hide(false),
        }
      : undefined;
  return (
    <View
      ref={setRef}
      {...rest}
      {...web}
      // Asked last, after everything inside: only a press nothing inside takes reaches it.
      onStartShouldSetResponder={() => true}
      onResponderRelease={(event: GestureResponderEvent) => {
        rest.onResponderRelease?.(event);
        show(false);
      }}
    >
      {children}
    </View>
  );
}

export interface TooltipContentProps extends Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
  /** A string is set in the tooltip's text style; other children style themselves. */
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
  const { open, anchor, show, hide } = useTooltip('Content');
  const { theme } = useTheme();
  if (!open) return null;
  const tooltip = mapTooltipStyle(theme);
  const web: Pick<WebTriggerProps, 'onPointerEnter' | 'onPointerLeave'> | undefined =
    Platform.OS === 'web'
      ? { onPointerEnter: () => show(false), onPointerLeave: () => hide(true) }
      : undefined;
  return (
    <FloatingLayer
      anchor={anchor}
      onDismiss={() => hide(false)}
      side={side}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      <View ref={ref} role="tooltip" {...rest} {...web} style={[tooltip.surface, style]}>
        {typeof children === 'string' ? <Text style={tooltip.text}>{children}</Text> : children}
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
