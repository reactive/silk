import { type ComponentRef, type JSX, type Ref, use, useMemo } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { mapPagerIndicatorStyle, type PagerIndicatorStyle } from '../../styles/mappers/visual.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import { WEB } from '../../web/host.js';
import { pageShare } from './pagerPhysics.js';
import { PagerState } from './pagerState.js';

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
  const { keys, enabledPages } = frame;
  return (
    <View
      {...rest}
      pointerEvents="none"
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[look.row, style]}
    >
      {keys.map((key, at) => (
        <Dot key={key} page={key} enabled={enabledPages[at]!} look={look} />
      ))}
    </View>
  );
}

/** Page `page`'s dot: as much a pill in the shown ink as that page is the shown one. */
function Dot({
  page,
  enabled,
  look: { dot, dotWidth, pillWidth, idle, disabled, shown },
}: {
  readonly page: string;
  readonly enabled: boolean;
  readonly look: PagerIndicatorStyle;
}) {
  const { position, pageKeys } = use(PagerState)!;
  const color = enabled ? idle : disabled;
  // The page's place is read from the UI thread's keys, so it moves with `position` when a page
  // is added or removed before it. Dependency arrays let a web build without the worklets Babel
  // plugin run this style.
  const motion = useAnimatedStyle(
    () => {
      const keys = pageKeys.value;
      const share = pageShare(position.value, keys.indexOf(page), keys.length);
      return {
        width: dotWidth + (pillWidth - dotWidth) * share,
        // Most dots have no share: skip parsing their colors each frame.
        backgroundColor:
          share <= 0 ? color : share >= 1 ? shown : interpolateColor(share, [0, 1], [color, shown]),
      };
    },
    WEB ? [position, pageKeys, page, dotWidth, pillWidth, color, shown] : undefined,
  );
  return <Animated.View style={[dot, motion]} />;
}
