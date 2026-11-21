import { selectRecipe, type SelectVariantProps } from '@reactive/silk-core';
import {
  type ComponentRef,
  createContext,
  type JSX,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  type StyleProp,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { a11yState, rnwAttrs } from '../styles/a11yProps.js';
import { mapListboxItemStyle } from '../styles/mappers/overlay.js';
import type { RnTextStyle } from '../styles/mappers/shared.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { usePopoverContext } from './Popover.js';
import { Pressable, type PressableProps } from './Pressable.js';
import { Text, type TextProps } from './Text.js';

const WEB = Platform.OS === 'web';
/** A listbox on the web; Android has none, so a radiogroup there. */
const LIST_ROLE = (WEB ? 'listbox' : 'radiogroup') as ViewProps['role'];

type ItemNode = ComponentRef<typeof View>;

/**
 * A key pressed in the list: react-native-web's `onKeyDown`, which React
 * Native before 0.84 doesn't type on View.
 */
interface KeyDownEvent {
  readonly nativeEvent: { readonly key: string };
  preventDefault(): void;
}

interface ListboxContextValue {
  readonly value: string | undefined;
  /** The item the keys act on: pointed at, or focused last. */
  readonly highlighted: string | undefined;
  /**
   * The item that takes Tab focus into the list: the highlighted, else the
   * chosen, else the first, of the enabled items shown; before they are
   * counted, every item does.
   */
  readonly tabStop: string | undefined;
  readonly highlight: (value: string) => void;
  readonly pick: (value: string) => void;
  readonly focus: (value: string) => void;
  /** Whether an item of this list holds focus, so pointing moves focus too (web). */
  readonly holdsFocus: () => boolean;
  readonly register: (value: string, node: ItemNode | null, disabled: boolean) => void;
  readonly variant: SelectVariantProps;
}

const ListboxContext = createContext<ListboxContextValue | null>(null);

export interface ListboxRootProps
  extends SelectVariantProps, Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  /** The chosen item's value, if any. Controlled. */
  readonly value: string | undefined;
  /** Called when an item other than the chosen one is picked. */
  readonly onValueChange: (value: string) => void;
  /** Called as the highlighted item (pointed at, or focused last) changes. */
  readonly onHighlightChange?: (value: string | undefined) => void;
  /** Focuses the chosen item (else the first) on mount, as for a list opened from the keyboard. @default false */
  readonly autoFocus?: boolean;
}

/**
 * A list to pick one item from. On the web it is a `listbox` of `option`s
 * with one Tab stop: ArrowUp/ArrowDown move focus between the items,
 * Home/End jump to either end, Space or Enter picks the focused item, and a
 * mouse or pen pointing at an item highlights it (and moves focus there while
 * the list holds focus). Android has no listbox, so it is a `radiogroup` of
 * `radio`s there. Inside `Popover.Content`, a pick (even of the chosen item)
 * and Tab close the popover. The keys it handles have their default
 * prevented, so page-wide key handlers can leave them alone.
 */
function ListboxRoot({
  value,
  onValueChange,
  onHighlightChange,
  autoFocus = false,
  size,
  density,
  style,
  children,
  ref,
  ...rest
}: ListboxRootProps): JSX.Element {
  const defaults = useComponentDefaults('Select');
  const popover = usePopoverContext();
  const [highlighted, setHighlighted] = useState<string>();
  const items = useRef(new Map<string, { node: ItemNode; disabled: boolean }>());
  // The enabled items' values in order, counted after each commit: an item
  // filtered out or disabled can't hold the Tab stop or take a key.
  const [shown, setShown] = useState<readonly string[]>();

  const enabled = () =>
    inTreeOrder(items.current)
      .filter(([, item]) => !item.disabled)
      .map(([itemValue]) => itemValue);
  useLayoutEffect(() => {
    const now = enabled();
    setShown((was) => (was && sameList(was, now) ? was : now));
  });
  /** `target`, if it names an enabled item shown. */
  const live = (target: string | undefined) =>
    target !== undefined && shown?.includes(target) ? target : undefined;
  const focus = (target: string) => items.current.get(target)?.node.focus();
  const highlight = (next: string) => {
    if (next === highlighted) return;
    setHighlighted(next);
    onHighlightChange?.(next);
  };
  const pick = (picked: string) => {
    if (picked !== value) onValueChange(picked);
    popover?.close();
  };
  const holdsFocus = () => {
    const active = activeElement();
    return [...items.current.values()].some(({ node }) => node === active);
  };

  useEffect(() => {
    if (!autoFocus) return;
    const order = enabled();
    const target = value !== undefined && order.includes(value) ? value : order[0];
    if (target !== undefined) focus(target);
    // As it turns on: on mount, or later for a list opened by pointing, then pressed.
  }, [autoFocus]);

  const onKeyDown = (event: KeyDownEvent) => {
    const { key } = event.nativeEvent;
    const order = enabled();
    const at = Math.max(0, order.indexOf(live(highlighted) ?? live(value) ?? ''));
    let target: number | undefined;
    switch (key) {
      case 'ArrowDown':
        target = Math.min(at + 1, order.length - 1);
        break;
      case 'ArrowUp':
        target = Math.max(at - 1, 0);
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = order.length - 1;
        break;
      case ' ': {
        // Enter presses the focused item already (react-native-web presses on Enter).
        const focused = live(highlighted);
        if (focused === undefined) return;
        event.preventDefault();
        pick(focused);
        return;
      }
      case 'Tab':
        if (!popover) return;
        // Focus goes back to the anchor as the popover closes.
        event.preventDefault();
        popover.close();
        return;
      default:
        return;
    }
    const next = order[target];
    if (next === undefined) return;
    event.preventDefault();
    focus(next);
  };

  const tabStop = shown && (live(highlighted) ?? live(value) ?? shown[0]);
  const variant: SelectVariantProps = {
    size: size ?? defaults.size ?? selectRecipe.defaults.size,
    density: density ?? defaults.density ?? selectRecipe.defaults.density,
  };
  // Stable, so an item's ref callback keeps its place in mount order across renders.
  const register = useCallback((itemValue: string, node: ItemNode | null, disabled: boolean) => {
    if (node) items.current.set(itemValue, { node, disabled });
    else items.current.delete(itemValue);
  }, []);

  return (
    <ListboxContext.Provider
      value={{ value, highlighted, tabStop, highlight, pick, focus, holdsFocus, register, variant }}
    >
      <View
        ref={ref}
        // React Native's role type lacks the web's listbox.
        role={LIST_ROLE}
        {...rest}
        {...({ onKeyDown } as object)}
        style={style}
      >
        {children}
      </View>
    </ListboxContext.Provider>
  );
}

export interface ListboxItemProps
  extends Omit<PressableProps, 'children' | 'style' | 'onPress'> {
  readonly value: string;
  /** Its label: a string or number shows in Silk's item text; anything else lays out as given. */
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly disabled?: boolean;
}

/** The label style of the item around, which follows its state. */
const ItemLabelContext = createContext<RnTextStyle | null>(null);

/** An item of a `Listbox`: a check in its indicator slot when chosen, lit while highlighted. */
function ListboxItem({
  value,
  children,
  style,
  disabled = false,
  ref,
  onFocus,
  onPointerMove,
  ...rest
}: ListboxItemProps): JSX.Element {
  const list = useContext(ListboxContext);
  if (!list) throw new Error('Listbox.Item must be used within Listbox.Root');
  const { theme } = useTheme();
  const selected = list.value === value;
  const highlighted = list.highlighted === value;
  const { row, indicator, label } = mapListboxItemStyle(theme, list.variant, {
    highlighted,
    selected,
    disabled,
  });
  const isTabStop = !disabled && (list.tabStop === undefined || list.tabStop === value);
  const { register } = list;
  const setNode = useCallback(
    (node: ItemNode | null) => {
      register(value, node, disabled);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [register, value, disabled, ref],
  );
  return (
    <Pressable
      ref={setNode}
      {...rest}
      role={WEB ? 'option' : 'radio'}
      {...(WEB
        ? rnwAttrs({ 'aria-selected': selected, 'aria-disabled': disabled || undefined })
        : a11yState({ checked: selected, disabled }))}
      disabled={disabled}
      // One Tab stop for the list: the arrows move between the items.
      tabIndex={isTabStop ? 0 : -1}
      // A move, not an enter: items scrolling under a still pointer as the
      // arrows move focus don't take it back. A finger never highlights.
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (highlighted || disabled || event.nativeEvent.pointerType === 'touch') return;
        if (list.holdsFocus()) list.focus(value);
        else list.highlight(value);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!disabled) list.highlight(value);
      }}
      onPress={() => list.pick(value)}
      style={[row, style]}
      {...rnwAttrs({ 'data-highlighted': highlighted || undefined })}
    >
      <ItemLabelContext.Provider value={label}>
        <View style={indicator}>{selected ? <ListboxItemText>✓</ListboxItemText> : null}</View>
        {typeof children === 'string' || typeof children === 'number' ? (
          <ListboxItemText>{children}</ListboxItemText>
        ) : (
          children
        )}
      </ItemLabelContext.Provider>
    </Pressable>
  );
}

export type ListboxItemTextProps = TextProps;

/**
 * Text in a `Listbox.Item` with custom children, colored as the item's own
 * label is: lit while highlighted or chosen, dimmed while disabled. A string
 * child is wrapped in it already.
 */
function ListboxItemText({ role = 'bodySm', style, ...props }: ListboxItemTextProps): JSX.Element {
  const label = useContext(ItemLabelContext);
  if (!label) throw new Error('Listbox.ItemText must be used within Listbox.Item');
  return <Text role={role} {...props} style={[label, style]} />;
}

/** react-native-web's focused DOM element (silk-native doesn't load DOM types). */
function activeElement(): unknown {
  return (globalThis as { document?: { activeElement?: unknown } }).document?.activeElement;
}

interface DomNode {
  compareDocumentPosition?: (other: DomNode) => number;
}
/** `Node.DOCUMENT_POSITION_FOLLOWING`. */
const FOLLOWING = 4;

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((item, at) => item === b[at]);

/**
 * The items in the order they appear: on the web, by their place in the
 * page (items mounted later may sit between earlier ones); elsewhere, by
 * when they mounted.
 */
function inTreeOrder<V>(items: ReadonlyMap<string, V & { node: ItemNode }>): Array<[string, V]> {
  const entries = [...items.entries()];
  return entries.sort(([, a], [, b]) => {
    const first = a.node as unknown as DomNode;
    const second = b.node as unknown as DomNode;
    const position = first.compareDocumentPosition?.(second);
    if (position === undefined) return 0;
    return position & FOLLOWING ? -1 : 1;
  });
}

export interface ListboxNamespace {
  readonly Root: typeof ListboxRoot;
  readonly Item: typeof ListboxItem;
  readonly ItemText: typeof ListboxItemText;
}

export const Listbox: ListboxNamespace = {
  Root: ListboxRoot,
  Item: ListboxItem,
  ItemText: ListboxItemText,
};
