import type { ToneName } from '@reactive/silk-core';
import {
  useEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Platform,
  Pressable as RNPressable,
  type NativeSyntheticEvent,
  type PressableProps as RNPressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type TargetedEvent,
  type View,
  type ViewStyle,
} from 'react-native';
import { mapFocusRingStyle } from '../styles/mappers/focus.js';
import { useTheme } from '../theme/ThemeProvider.js';

/** What a Pressable's `style` and `children` functions receive. */
export interface PressableState extends PressableStateCallbackType {
  /** The pointer is over it (react-native-web only; always false on native). */
  readonly hovered: boolean;
  /**
   * It has focus the user should see: on the web, the browser's
   * `:focus-visible` (keyboard, not a mouse click); on native, any focus,
   * which only a keyboard, D-pad or assistive technology gives a Pressable.
   */
  readonly focusVisible: boolean;
}

export interface PressableProps
  extends Omit<RNPressableProps, 'children' | 'style'> {
  readonly ref?: Ref<View> | undefined;
  readonly children?: ReactNode | ((state: PressableState) => ReactNode);
  readonly style?:
    | StyleProp<ViewStyle>
    | ((state: PressableState) => StyleProp<ViewStyle>);
  /**
   * The tone whose `focusRing` color outlines it while `focusVisible`, or
   * `false` to draw no ring (only when the children show focus themselves).
   * @default 'accent'
   */
  readonly focusRing?: ToneName | false | undefined;
}

type FocusEvent = NativeSyntheticEvent<TargetedEvent>;
/** The DOM element react-native-web focuses (silk-native doesn't load DOM types). */
interface FocusTarget {
  matches?: (selector: string) => boolean;
  ownerDocument?: {
    addEventListener(type: string, listener: () => void, capture: boolean): void;
    removeEventListener(type: string, listener: () => void, capture: boolean): void;
  };
}

/**
 * The browser decides whether focus should show (`:focus-visible`), so a click
 * doesn't ring a button but Tab does.
 */
function matchesFocusVisible(target: FocusTarget): boolean {
  try {
    return target.matches?.(':focus-visible') ?? true;
  } catch {
    // A browser too old for :focus-visible: show every focus.
    return true;
  }
}

/**
 * React Native's Pressable with Silk's keyboard focus ring: a drop-in
 * replacement that outlines it in the theme's focus color while it has
 * visible focus. Use it for any custom pressable; Silk's own controls use it
 * already. `style` composes after the ring, so it can adjust it (for example
 * a smaller `outlineOffset` in a dense list).
 */
export function Pressable({
  focusRing = 'accent',
  style,
  children,
  onFocus,
  onBlur,
  ref,
  ...rest
}: PressableProps): JSX.Element {
  const { theme } = useTheme();
  const [focusVisible, setFocusVisible] = useState(false);
  // Web: while focused, keys can turn :focus-visible on without a new focus
  // event (click a control, then press Space), so check again on each key.
  const stopWatchingKeys = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => stopWatchingKeys.current?.(), []);
  const watchKeys = (target: FocusTarget): void => {
    stopWatchingKeys.current?.();
    const doc = target.ownerDocument;
    if (!doc) return;
    const check = (): void => setFocusVisible(matchesFocusVisible(target));
    doc.addEventListener('keydown', check, true);
    doc.addEventListener('keyup', check, true);
    stopWatchingKeys.current = () => {
      doc.removeEventListener('keydown', check, true);
      doc.removeEventListener('keyup', check, true);
      stopWatchingKeys.current = undefined;
    };
  };
  const ring =
    focusVisible && focusRing !== false
      ? mapFocusRingStyle(theme, focusRing)
      : undefined;
  const withFocus = (state: PressableStateCallbackType): PressableState => ({
    ...state,
    hovered: (state as { hovered?: boolean }).hovered ?? false,
    focusVisible,
  });

  return (
    <RNPressable
      ref={ref}
      {...rest}
      onFocus={(event) => {
        if (Platform.OS === 'web') {
          const target = event.target as unknown as FocusTarget;
          setFocusVisible(matchesFocusVisible(target));
          watchKeys(target);
        } else {
          // Native Pressables take focus only from a keyboard, D-pad or
          // assistive technology, so every focus shows.
          setFocusVisible(true);
        }
        onFocus?.(event);
      }}
      onBlur={(event) => {
        stopWatchingKeys.current?.();
        setFocusVisible(false);
        onBlur?.(event);
      }}
      style={(state) => [
        ring,
        typeof style === 'function' ? style(withFocus(state)) : style,
      ]}
    >
      {typeof children === 'function'
        ? (state) => children(withFocus(state))
        : children}
    </RNPressable>
  );
}
