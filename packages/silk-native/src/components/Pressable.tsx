import type { ToneName } from '@reactive/silk-core';
import {
  type ComponentRef,
  useCallback,
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
  type PressableProps as RNPressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';
import { type FocusTarget, matchesFocusVisible } from '../styles/a11yProps.js';
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
  readonly ref?: Ref<ComponentRef<typeof View>> | undefined;
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

/**
 * Whether focus should show, with the focus and blur handlers that track it.
 * Web: the browser's `:focus-visible`, checked again on each key until it
 * matches, since a key can turn it on without a new focus event (click a
 * control, then press Space). Native: every focus, since only a keyboard,
 * D-pad or assistive technology focuses a Pressable.
 */
function useFocusVisible(): {
  focusVisible: boolean;
  onFocus: (target: FocusTarget) => void;
  onBlur: () => void;
} {
  const [focusVisible, setFocusVisible] = useState(false);
  const stopWatchingKeys = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => stopWatchingKeys.current?.(), []);

  const onFocus = useCallback((target: FocusTarget): void => {
    stopWatchingKeys.current?.();
    const visible = Platform.OS !== 'web' || matchesFocusVisible(target);
    setFocusVisible(visible);
    const doc = target.ownerDocument;
    if (visible || !doc) return;
    // Watch keys only until the ring shows; it then stays until blur.
    const check = (): void => {
      if (!matchesFocusVisible(target)) return;
      setFocusVisible(true);
      stopWatchingKeys.current?.();
    };
    doc.addEventListener('keydown', check, true);
    doc.addEventListener('keyup', check, true);
    stopWatchingKeys.current = () => {
      doc.removeEventListener('keydown', check, true);
      doc.removeEventListener('keyup', check, true);
      stopWatchingKeys.current = undefined;
    };
  }, []);
  const onBlur = useCallback((): void => {
    stopWatchingKeys.current?.();
    setFocusVisible(false);
  }, []);
  return { focusVisible, onFocus, onBlur };
}

/**
 * React Native's Pressable with Silk's keyboard focus ring: a drop-in
 * replacement that outlines it in the theme's focus color while it has
 * visible focus. Use it for any custom pressable; Silk's own controls use it
 * already. `style` composes after the ring, so it can adjust it (for example
 * a smaller `outlineOffset` in a dense list).
 */
export function Pressable({
  focusRing,
  style,
  children,
  onFocus,
  onBlur,
  ref,
  ...rest
}: PressableProps): JSX.Element {
  const { theme } = useTheme();
  const { focusVisible, onFocus: trackFocus, onBlur: trackBlur } =
    useFocusVisible();
  const handleFocus = useCallback<NonNullable<RNPressableProps['onFocus']>>(
    (event) => {
      // react-native-web calls this only for this element's own focus, not
      // a focused child's; on the web the target is that DOM element.
      trackFocus(event.target as unknown as FocusTarget);
      onFocus?.(event);
    },
    [trackFocus, onFocus],
  );
  const handleBlur = useCallback<NonNullable<RNPressableProps['onBlur']>>(
    (event) => {
      trackBlur();
      onBlur?.(event);
    },
    [trackBlur, onBlur],
  );
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
      onFocus={handleFocus}
      onBlur={handleBlur}
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
