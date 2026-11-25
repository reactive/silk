/**
 * The page as react-native-web hands it to silk-native's shared components:
 * its events, a View's DOM node and `document`. Each shape names only the
 * members those components use, so their signatures carry no DOM types (only
 * the web floating layer, `overlay/layer.dom.tsx`, loads the DOM lib).
 */
import { Platform } from 'react-native';

/** Running in a browser, through react-native-web. */
export const WEB: boolean = Platform.OS === 'web';

/**
 * A key pressed on a focused element: react-native-web's `onKeyDown`, which
 * React Native's View types lack before 0.84.
 */
export interface WebKeyDownEvent {
  readonly nativeEvent: {
    readonly key: string;
    readonly shiftKey?: boolean;
    /** A held key's repeat. */
    readonly repeat?: boolean;
  };
  /** The element the key went to: the focused one. */
  readonly target?: unknown;
  /** The element whose handler hears it. */
  readonly currentTarget?: unknown;
  preventDefault(): void;
  /** Whether a handler that heard it first called `preventDefault()`. */
  isDefaultPrevented?(): boolean;
}

/**
 * `handler` as react-native-web's `onKeyDown` prop, typed here once so the
 * components that take keys don't each cast it.
 */
export function webKeyHandler(handler: (event: WebKeyDownEvent) => void): {
  readonly onKeyDown: (event: WebKeyDownEvent) => void;
} {
  return { onKeyDown: handler };
}

/** A DOM node as react-native-web hands it over: a View's ref is one. */
export interface WebNode {
  contains(other: WebNode): boolean;
  /** A bit mask; `FOLLOWING` set when `other` comes after it in the page. */
  compareDocumentPosition?(other: WebNode): number;
  matches?(selector: string): boolean;
  readonly ownerDocument?: WebDocument;
}

/** `Node.DOCUMENT_POSITION_FOLLOWING`. */
export const FOLLOWING = 4;

/** A View's ref as its DOM node, on the web. */
export const webNode = (view: unknown): WebNode => view as WebNode;

/** react-native-web's blur and focus `nativeEvent`: where focus went, or came from. */
export interface WebFocusEvent {
  readonly relatedTarget: WebNode | null;
}

/** A key event as the page's listeners get it. */
export interface WebKeyEvent {
  readonly key: string;
  /** A held key's repeat. */
  readonly repeat: boolean;
  /** Something that handled it said so (`preventDefault()`); read after it was dispatched. */
  readonly defaultPrevented: boolean;
}

/** A click as the page's listeners get it. */
export interface WebClickEvent {
  stopPropagation(): void;
  preventDefault(): void;
}

/** The page's `document`: what listening on it, and finding focus, take. */
export interface WebDocument {
  readonly activeElement?: unknown;
  addEventListener(
    type: 'keydown',
    listener: (event: WebKeyEvent) => void,
    options: boolean | { readonly capture: boolean; readonly once?: boolean },
  ): void;
  addEventListener(
    type: 'click',
    listener: (event: WebClickEvent) => void,
    options: { readonly capture: boolean; readonly once?: boolean },
  ): void;
  addEventListener(
    type: string,
    listener: () => void,
    options: boolean | { readonly capture: boolean; readonly once?: boolean },
  ): void;
  removeEventListener(
    type: 'keydown',
    listener: (event: WebKeyEvent) => void,
    options: boolean | { readonly capture: boolean },
  ): void;
  removeEventListener(
    type: 'click',
    listener: (event: WebClickEvent) => void,
    options: { readonly capture: boolean },
  ): void;
  removeEventListener(
    type: string,
    listener: () => void,
    options: boolean | { readonly capture: boolean },
  ): void;
}

/** The page's `document` on the web, or nothing on native. */
export const webDocument = (): WebDocument | undefined =>
  (globalThis as { document?: WebDocument }).document;

/**
 * Keeps the click a mouse drag ends with from reaching what the button went
 * down on: the browser clicks it when the button comes up, so a drag that
 * began on a pressable would also press it. Call when the drag ends, before
 * the browser's next task; a drag by touch ends without a click, so the
 * listener goes at that task.
 */
export function swallowDragClick(): void {
  const page = webDocument();
  if (!page) return;
  const swallow = (event: WebClickEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };
  page.addEventListener('click', swallow, { capture: true, once: true });
  setTimeout(() => page.removeEventListener('click', swallow, { capture: true }), 0);
}

/**
 * The browser decides whether focus should show (`:focus-visible`), so a click
 * doesn't ring a button but Tab does.
 */
export function matchesFocusVisible(target: WebNode): boolean {
  try {
    return target.matches?.(':focus-visible') ?? true;
  } catch {
    // A browser too old for :focus-visible: show every focus.
    return true;
  }
}
