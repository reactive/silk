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
   * counted, the chosen one, else every item.
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
  const enabled = () =>
    inTreeOrder(items.current)
      .filter(([, item]) => !item.disabled)
      .map(([itemValue]) => itemValue);
  // Bumped as items register, leave or change `disabled`, which happens in
  // whichever component renders them, so this list renders again then too.
  const [, setItemChanges] = useState(0);
  // The enabled items' values in order, recounted after each commit of this
  // list: an item filtered out or disabled can't hold the Tab stop or take a
  // key. Unknown until the items commit.
  const [enabledItems, setEnabledItems] = useState<readonly string[]>();
  useLayoutEffect(() => {
    const now = enabled();
    setEnabledItems((was) => (was && sameList(was, now) ? was : now));
  });
  /** `target`, if it names an enabled item shown. */
  const enabledItem = (target: string | undefined) =>
    target !== undefined && enabledItems?.includes(target) ? target : undefined;
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
  /** The item the keys move from: the highlighted, else the chosen. */
  const current = enabledItem(highlighted) ?? enabledItem(value);

  useEffect(() => {
    if (!autoFocus || !enabledItems) return;
    const target = enabledItem(value) ?? enabledItems[0];
    if (target !== undefined) focus(target);
    // As it turns on (on mount, or later for a list opened by pointing, then
    // pressed), once the items are counted; not again as they change.
  }, [autoFocus, enabledItems === undefined]);

  const onKeyDown = (event: KeyDownEvent) => {
    const { key } = event.nativeEvent;
    if (key === ' ') {
      // Enter presses the focused item already (react-native-web presses on Enter).
      const focused = enabledItem(highlighted);
      if (focused === undefined) return;
      event.preventDefault();
      pick(focused);
    } else if (key === 'Tab') {
      if (!popover) return;
      // Focus goes back to the anchor as the popover closes.
      event.preventDefault();
      popover.close();
    } else {
      // In the order on the page now: items a child reordered on its own keep their nodes.
      const order = enabled();
      const next = order[moveTo(key, current, order) ?? -1];
      if (next === undefined) return;
      event.preventDefault();
      focus(next);
    }
  };

  // Before the items are counted (as on a server), the chosen one, else every one.
  const tabStop = enabledItems ? (current ?? enabledItems[0]) : value;
  const variant: SelectVariantProps = {
    size: size ?? defaults.size ?? selectRecipe.defaults.size,
    density: density ?? defaults.density ?? selectRecipe.defaults.density,
  };
  // Stable, so an item's ref callback keeps its place in mount order across renders.
  const register = useCallback((itemValue: string, node: ItemNode | null, disabled: boolean) => {
    if (node) items.current.set(itemValue, { node, disabled });
    else items.current.delete(itemValue);
    setItemChanges((count) => count + 1);
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

/**
 * The index in `order` that an arrow, Home or End moves to from `from`
 * (nothing focused yet moves to the first); nothing for any other key.
 */
function moveTo(key: string, from: string | undefined, order: readonly string[]): number | undefined {
  const at = from === undefined ? -1 : order.indexOf(from);
  if (key === 'ArrowDown') return Math.min(at + 1, order.length - 1);
  if (key === 'ArrowUp') return Math.max(at - 1, 0);
  if (key === 'Home') return 0;
  if (key === 'End') return order.length - 1;
  return undefined;
}

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
