import { popoverRecipe, type PopoverVariantProps } from '@reactive/silk-core';
import {
  type ComponentRef,
  createContext,
  type JSX,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { type StyleProp, View, type ViewProps, type ViewStyle } from 'react-native';
// The platform's layer: `layer.modal` on native, `layer.dom` on the web (package.json `imports`).
import { FloatingLayer } from '#floating-layer';
import type { FloatingAlign, FloatingSide } from '../overlay/place.js';
import { mapPopoverStyle } from '../styles/mappers/overlay.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

interface PopoverContextValue {
  readonly open: boolean;
  readonly anchor: RefObject<ComponentRef<typeof View> | null>;
  /** Asks the popover to close, as a press outside it does. */
  readonly close: () => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

/** The popover around the caller, if any: a `Listbox` inside one closes it on a pick. */
export function usePopoverContext(): PopoverContextValue | null {
  return useContext(PopoverContext);
}

export interface PopoverRootProps {
  /** Whether it shows. Controlled: the popover asks to close through `onOpenChange(false)`. */
  readonly open: boolean;
  /**
   * Called with `false` for a press outside it and its anchor, Escape (web),
   * the back button (Android), scrolling that moves the anchor, a resized
   * window, or a pick in a `Listbox` inside it.
   */
  readonly onOpenChange: (open: boolean) => void;
  /**
   * What it opens from, usually the control that toggles `open`. On the web,
   * a press on it is left to the anchor's own toggle; on native the layer
   * covers it, so a press there closes the popover as any press outside does.
   */
  readonly anchor: RefObject<ComponentRef<typeof View> | null>;
  readonly children?: ReactNode;
}

function PopoverRoot({ open, onOpenChange, anchor, children }: PopoverRootProps): JSX.Element {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const value = useMemo(() => ({ open, anchor, close }), [open, anchor, close]);
  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

export interface PopoverContentProps
  extends PopoverVariantProps, Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
  readonly children?: ReactNode;
  /** The surface's style, after Silk's. */
  readonly style?: StyleProp<ViewStyle>;
  /**
   * The anchor's side it prefers; it takes the other when it doesn't fit and
   * the other has more room, and shrinks to the room on the side it takes.
   * @default 'bottom'
   */
  readonly side?: FloatingSide;
  /** Which of the anchor's edges it lines up with, or its middle. @default 'center' */
  readonly align?: FloatingAlign;
  /** Space between it and the anchor. @default 4 */
  readonly sideOffset?: number;
  /** The least space it keeps from the window's edges. @default 8 */
  readonly collisionPadding?: number;
}

/**
 * A surface floating beside the popover's anchor while open. Non-modal on the
 * web: the page stays live (a pointer can still hover the anchor), focus stays
 * where it was until something inside takes it, and no `aria-modal` is set.
 * On native it is a transparent Modal. Its pointer props (`onPointerEnter`,
 * `onPointerLeave`) reach the surface, for menus that open on hover.
 */
function PopoverContent({
  size,
  side = 'bottom',
  align = 'center',
  sideOffset = 4,
  collisionPadding = 8,
  style,
  children,
  ref,
  ...rest
}: PopoverContentProps): JSX.Element | null {
  const popover = useContext(PopoverContext);
  if (!popover) throw new Error('Popover.Content must be used within Popover.Root');
  const { theme } = useTheme();
  const defaults = useComponentDefaults('Popover');
  if (!popover.open) return null;
  const surface = mapPopoverStyle(theme, {
    size: size ?? defaults.size ?? popoverRecipe.defaults.size,
  });
  return (
    <FloatingLayer
      anchor={popover.anchor}
      onDismiss={popover.close}
      side={side}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
    >
      <View ref={ref} {...rest} style={[surface, style]}>
        {children}
      </View>
    </FloatingLayer>
  );
}

export interface PopoverNamespace {
  readonly Root: typeof PopoverRoot;
  readonly Content: typeof PopoverContent;
}

export const Popover: PopoverNamespace = {
  Root: PopoverRoot,
  Content: PopoverContent,
};
