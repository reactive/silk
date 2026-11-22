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
  useState,
} from 'react';
import {
  type StyleProp,
  Text as RNText,
  type TextProps as RNTextProps,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
// The platform's layer: `layer.modal` on native, `layer.dom` on the web (package.json `imports`).
import { FloatingLayer } from '#floating-layer';
// Native: whether it is inside a line of text; always false on the web (package.json `imports`).
import { useInText } from '#in-text';
import type { Box, FloatingAlign, FloatingSide } from '../overlay/place.js';
import { mapTooltipStyle } from '../styles/mappers/overlay.js';
import { typographyStyle } from '../styles/mappers/shared.js';
import { useTheme } from '../theme/ThemeProvider.js';
import {
  matchesFocusVisible,
  WEB,
  type WebFocusEvent,
  webDocument,
  webNode,
} from '../web/host.js';
import { assignRef } from './assignRef.js';
import { Text } from './Text.js';
import { useControllableValue } from './useControllableValue.js';

/** How long a pointer leaving the trigger has to reach the tooltip before it closes. */
const LEAVE_GRACE_MS = 100;
/** @default of `delayDuration`, as web's. */
const DELAY_MS = 700;
/**
 * What ends a press on the trigger, wherever on the page: its click (on what
 * holds both where it went down and where it came up), or no click at all.
 */
const PRESS_ENDS = ['click', 'contextmenu', 'pointercancel'] as const;

interface TooltipContextValue {
  readonly open: boolean;
  readonly anchor: RefObject<ComponentRef<typeof View> | null>;
  /** Where a trigger with no box of its own was tapped: the box it opens beside. */
  readonly spot: Box | undefined;
  /** Whether its trigger has no box of its own (a span inside text), so only a tap places it. */
  readonly boxless: boolean;
  readonly setBoxless: (boxless: boolean) => void;
  readonly openNow: () => void;
  /** Opens it beside `box`, for a trigger with no box of its own (words in a line). */
  readonly openAt: (box: Box) => void;
  /** Opens it once a mouse has rested for the delay, unless something changes it first. */
  readonly openAfterDelay: () => void;
  /** Closes it, unless a press inside the trigger is underway. */
  readonly closeNow: () => void;
  /**
   * Closes it after a pointer's moment to reach the tooltip, unless something
   * changes it first. Not held by a press: a mouse leaving ends its hover.
   */
  readonly closeAfterGrace: () => void;
  /**
   * A press inside the trigger, from its start to its end: its mousedown may
   * move focus out (to the nearest focusable box around the part it landed
   * on, such as a popover's surface), which mustn't close the tooltip the
   * press opens. A touch's mousedown comes only after the finger lifts.
   */
  readonly pressStarted: () => void;
  readonly pressEnded: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);
/** The delay a `Tooltip.Provider` sets for the tooltips inside it. */
const DelayContext = createContext(DELAY_MS);

function useTooltip(part: string): TooltipContextValue {
  const tooltip = useContext(TooltipContext);
  if (!tooltip) throw new Error(`Tooltip.${part} must be used within Tooltip.Root`);
  return tooltip;
}

export interface TooltipProviderProps {
  /** Milliseconds a mouse rests on a trigger before its tooltip opens (web). @default 700 */
  readonly delayDuration?: number;
  readonly children?: ReactNode;
}

/**
 * Sets the hover delay for the tooltips inside it, as web's `Tooltip.Provider`
 * does. Optional here: without one, a tooltip waits the default.
 */
function TooltipProvider({ delayDuration = DELAY_MS, children }: TooltipProviderProps): JSX.Element {
  return <DelayContext.Provider value={delayDuration}>{children}</DelayContext.Provider>;
}

export interface TooltipRootProps {
  /** Whether it shows. Leave it out for the tooltip to keep its own state. */
  readonly open?: boolean;
  /** @default false */
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** Milliseconds a mouse rests on the trigger before it opens (web). @default the Provider's, or 700 */
  readonly delayDuration?: number;
  readonly children?: ReactNode;
}

function TooltipRoot({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  delayDuration: delayProp,
  children,
}: TooltipRootProps): JSX.Element {
  const providerDelay = useContext(DelayContext);
  const delayDuration = delayProp ?? providerDelay;
  const [open, setUncontrolled] = useControllableValue(openProp, defaultOpen);
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const [spot, setSpot] = useState<Box>();
  const [boxless, setBoxless] = useState(false);
  // A tap's spot belongs to the open it started: once closed (however, the
  // owner's `open` included), a later open without a tap has none.
  if (!open && spot) setSpot(undefined);
  const pressing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The latest, for timers that fire after a render.
  const latest = useRef({ open, setUncontrolled, onOpenChange });
  // The change it last asked its owner for, until it renders or a zero-delay
  // timer clears it: two closes in one event (focus leaving, and the layer
  // seeing focus go outside) ask once.
  const requested = useRef<boolean>(undefined);
  useLayoutEffect(() => {
    latest.current = { open, setUncontrolled, onOpenChange };
    requested.current = undefined;
  });

  const pressEnded = useCallback(() => {
    pressing.current = false;
    for (const type of PRESS_ENDS) {
      webDocument()?.removeEventListener(type, pressEnded, { capture: true });
    }
  }, []);
  const pressStarted = useCallback(() => {
    pressing.current = true;
    // The page hears the press end wherever it does.
    for (const type of PRESS_ENDS) {
      webDocument()?.addEventListener(type, pressEnded, { capture: true, once: true });
    }
  }, [pressEnded]);
  useEffect(() => () => clearTimeout(timer.current), []);

  // A change made now supersedes one a timer was waiting to make.
  const setOpen = useCallback((next: boolean) => {
    clearTimeout(timer.current);
    const { open: shown, setUncontrolled: set, onOpenChange: report } = latest.current;
    if (next === (requested.current ?? shown)) return;
    requested.current = next;
    setTimeout(() => {
      requested.current = undefined;
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
      // Opened from the trigger's own box, not a spot an earlier tap left.
      openNow: () => {
        setSpot(undefined);
        setOpen(true);
      },
      openAt: (box: Box) => {
        setSpot(box);
        setOpen(true);
      },
      openAfterDelay: () => later(true, delayDuration),
      closeNow: () => {
        if (!pressing.current) setOpen(false);
      },
      closeAfterGrace: () => later(false, LEAVE_GRACE_MS),
      pressStarted,
      pressEnded,
    }),
    [setOpen, later, delayDuration, pressStarted, pressEnded],
  );
  const value = useMemo(
    () => ({ open, anchor, spot, boxless, setBoxless, ...actions }),
    [open, spot, boxless, actions],
  );
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

/** The Trigger's own handlers, which open and close it. */
type WebHandlers =
  | 'onPointerEnter'
  | 'onPointerLeave'
  | 'onPointerDown'
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
 * Inside a line of text on native, it is a span of that text instead of a
 * box, so it keeps to the line: put words in it, not controls. A tap opens
 * the tooltip beside the line where it landed, the line taken to be as tall
 * as `body` text's; with no tap (`open` alone) there it shows nothing. A
 * span has no box, so its style's padding, border and radius do nothing
 * there; its background does.
 *
 * The tooltip is not read by screen readers from the trigger: give the
 * control the same words (`accessibilityHint`, or `aria-describedby` to a
 * description) so they reach everyone.
 */
function TooltipTrigger(props: TooltipTriggerProps): JSX.Element {
  return useInText() ? <TextTrigger {...props} /> : <BoxTrigger {...props} />;
}

/**
 * The trigger inside a line of text on native. React Native sets a View
 * there with its bottom on the line's baseline, above the words around it,
 * and a span keeps to the line.
 */
function TextTrigger({ ref, children, ...rest }: TooltipTriggerProps): JSX.Element {
  const { openAt, setBoxless } = useTooltip('Trigger');
  const { theme } = useTheme();
  // Content, wherever it sits, waits for a tap to place it.
  useLayoutEffect(() => {
    setBoxless(true);
    return () => setBoxless(false);
  }, [setBoxless]);
  // The line it sits in is taken to be as tall as body text's.
  const { lineHeight = 0 } = typographyStyle(theme, 'body');
  return (
    <RNText
      // A View's and a Text's refs are the same host node on native.
      ref={ref as Ref<ComponentRef<typeof RNText>>}
      {...(rest as RNTextProps)}
      onPress={({ nativeEvent: { pageX, pageY, locationY } }) =>
        // Lines stack from the text's top, so the tap's height in the text
        // (locationY) past a whole number of lines is how far into its line it landed.
        openAt({
          x: pageX,
          y: pageY - (lineHeight ? locationY % lineHeight : 0),
          width: 0,
          height: lineHeight,
        })
      }
    >
      {children}
    </RNText>
  );
}

/** The trigger anywhere else: a box. */
function BoxTrigger({ ref, children, ...rest }: TooltipTriggerProps): JSX.Element {
  const { anchor, openNow, openAfterDelay, closeNow, closeAfterGrace, pressStarted, pressEnded } =
    useTooltip('Trigger');
  // A trigger gone mid-press holds the tooltip no longer.
  useEffect(() => pressEnded, [pressEnded]);
  const setRef = useCallback(
    (node: ComponentRef<typeof View> | null) => {
      anchor.current = node;
      assignRef(ref, node);
    },
    [anchor, ref],
  );
  const web: Pick<ViewProps, WebHandlers> | undefined = WEB
    ? {
        onPointerEnter: (event) => {
          if (event.nativeEvent.pointerType === 'mouse') openAfterDelay();
        },
        onPointerLeave: (event) => {
          if (event.nativeEvent.pointerType === 'mouse') closeAfterGrace();
        },
        // Focus from the keyboard (the browser's :focus-visible) opens it; a press's doesn't.
        onFocus: (event) => {
          if (matchesFocusVisible(webNode(event.target))) openNow();
        },
        // The main button's press, which ends with a click.
        onPointerDown: (event) => {
          if (event.nativeEvent.button === 0) pressStarted();
        },
        // Focus moving to another control inside keeps it open.
        onBlur: (event) => {
          const { relatedTarget } = event.nativeEvent as unknown as WebFocusEvent;
          const box = anchor.current;
          // No box: the trigger is unmounting while it has focus.
          if (!relatedTarget || !box || !webNode(box).contains(relatedTarget)) closeNow();
        },
      }
    : undefined;

  return (
    <View
      ref={setRef}
      {...rest}
      {...web}
      // Asked last, after everything inside: only a press nothing inside takes reaches it.
      onStartShouldSetResponder={() => true}
      onResponderRelease={openNow}
    >
      {children}
    </View>
  );
}

/** Content's own handlers: hovering on the web, a tap closing it on native. */
type ContentHandlers =
  | 'onPointerEnter'
  | 'onPointerLeave'
  | 'onStartShouldSetResponder'
  | 'onResponderRelease';

export interface TooltipContentProps
  extends Omit<ViewProps, 'children' | 'style' | ContentHandlers> {
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
 * it without closing it; on native it is a transparent Modal a tap anywhere,
 * itself included, closes.
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
  const { open, anchor, spot, boxless, openNow, closeNow, closeAfterGrace } =
    useTooltip('Content');
  const { theme } = useTheme();
  // A trigger inside text has no box: only a tap gives it one to open beside.
  // Opened by `open` alone it would be an unplaced layer taking the next tap, so it waits.
  if (!open || (boxless && !spot)) return null;
  const own: Pick<ViewProps, ContentHandlers> = WEB
    ? {
        // A mouse can rest on it; a touch lifting off it is no leave.
        onPointerEnter: (event) => {
          if (event.nativeEvent.pointerType === 'mouse') openNow();
        },
        onPointerLeave: (event) => {
          if (event.nativeEvent.pointerType === 'mouse') closeAfterGrace();
        },
      }
    : // A tap that nothing inside takes.
      { onStartShouldSetResponder: () => true, onResponderRelease: closeNow };
  return (
    <FloatingLayer
      anchor={anchor}
      anchorBox={spot}
      onDismiss={closeNow}
      side={side}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      <View
        ref={ref}
        role="tooltip"
        {...rest}
        {...own}
        style={[mapTooltipStyle(theme), style]}
      >
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text role="label">{children}</Text>
        ) : (
          children
        )}
      </View>
    </FloatingLayer>
  );
}

export interface TooltipNamespace {
  readonly Provider: typeof TooltipProvider;
  readonly Root: typeof TooltipRoot;
  readonly Trigger: typeof TooltipTrigger;
  readonly Content: typeof TooltipContent;
}

export const Tooltip: TooltipNamespace = {
  Provider: TooltipProvider,
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
};
