import type { ToneName } from '@reactive/silk-core';
import { useState, type JSX, type ReactNode, type Ref } from 'react';
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

/**
 * The browser decides whether focus should show (`:focus-visible`), so a click
 * doesn't ring a button but Tab does. Native Pressables take focus only from a
 * keyboard, D-pad or assistive technology, so every focus shows.
 */
function showsFocus(event: FocusEvent): boolean {
  if (Platform.OS !== 'web') return true;
  const target = event.target as unknown as { matches?: (s: string) => boolean };
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
        setFocusVisible(showsFocus(event));
        onFocus?.(event);
      }}
      onBlur={(event) => {
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
