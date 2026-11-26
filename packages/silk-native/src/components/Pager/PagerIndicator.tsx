import { type ComponentRef, type JSX, type Ref, use, useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { mapPagerIndicatorStyle, type PagerIndicatorStyle } from '../../styles/mappers/visual.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import { WEB } from '../../web/host.js';
import { pageShare } from './pagerPhysics.js';
import { PagerState, type PagerStateValue } from './pagerState.js';

export interface PagerIndicatorProps extends Omit<ViewProps, 'children'> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
}

/**
 * `Pager.Indicator`: a dot for each page of the `Pager.Root` it is a child
 * of, over the pager's foot, the shown page's widened to a pill in the
 * strongest ink. It follows a drag on the UI thread, the pill passing from
 * dot to dot as the pages move. A disabled page's dot is fainter. It only
 * shows: it takes no press (a drag that starts on it pages) and is hidden
 * from screen readers. Its `style` moves it, as below the pages with
 * `{ position: 'relative', bottom: 0 }`.
 */
export function PagerIndicator({ style, ...rest }: PagerIndicatorProps): JSX.Element {
  const frame = use(PagerState);
  if (!frame) throw new Error('Pager.Indicator: render it as a child of Pager.Root.');
  const { theme } = useTheme();
  const look = useMemo(() => mapPagerIndicatorStyle(theme), [theme]);
  const { position, pageKeys, keys, enabledPages } = frame;
  return (
    <View
      {...rest}
      pointerEvents="none"
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[look.row, style]}
    >
      {keys.map((key, at) => (
        <Dot
          key={key}
          page={key}
          enabled={enabledPages[at]!}
          position={position}
          pageKeys={pageKeys}
          look={look}
        />
      ))}
    </View>
  );
}

/** Page `page`'s dot: as much a pill in the shown ink as that page is the shown one. */
function Dot({
  page,
  enabled,
  position,
  pageKeys,
  look: { dot, dotWidth, pillWidth, idle, disabled, shown },
}: {
  readonly page: string;
  readonly enabled: boolean;
  readonly look: PagerIndicatorStyle;
} & Pick<PagerStateValue, 'position' | 'pageKeys'>) {
  // Each style reads the shared values in its own body, as Reanimated reruns it only for those.
  // Dependency arrays let a web build without the worklets Babel plugin run these styles.
  const widthStyle = useAnimatedStyle(
    () => {
      const share = shareOf(position.value, pageKeys.value, page);
      return { width: dotWidth + (pillWidth - dotWidth) * share };
    },
    WEB ? [position, pageKeys, page, dotWidth, pillWidth] : undefined,
  );
  // The shown ink fades in over the dot's own. Not `interpolateColor`: on the web a theme's
  // colors can be CSS variables, which it can't read.
  const inkStyle = useAnimatedStyle(
    () => ({ opacity: shareOf(position.value, pageKeys.value, page) }),
    WEB ? [position, pageKeys, page] : undefined,
  );
  return (
    <Animated.View style={[dot, { backgroundColor: enabled ? idle : disabled }, widthStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: shown }, inkStyle]} />
    </Animated.View>
  );
}

/**
 * How much page `page` is the shown one at `position`. Its place is read
 * from the UI thread's `keys`, so it moves with `position` when a page is
 * added or removed before it.
 */
function shareOf(position: number, keys: readonly string[], page: string): number {
  'worklet';
  return pageShare(position, keys.indexOf(page), keys.length);
}
