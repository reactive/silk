import { type ComponentRef, type Context, createContext, type JSX, type Ref, use } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { mapPagerIndicatorStyle, type PagerIndicatorStyle } from '../../styles/mappers/visual.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import { WEB } from '../../web/host.js';
import { pageShare } from './pagerPhysics.js';

export interface PagerIndicatorProps extends Omit<ViewProps, 'children'> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
}

/**
 * What `Pager.Root` tells its indicator: its pages as React renders them
 * (`keys`, `enabledPages`), and where they stand as the UI thread has them
 * (`position` of `pageKeys`, which change together).
 */
interface IndicatorFrameValue {
  readonly position: SharedValue<number>;
  readonly pageKeys: SharedValue<readonly string[]>;
  readonly keys: readonly string[];
  readonly enabledPages: readonly boolean[];
}

export const IndicatorFrame: Context<IndicatorFrameValue | null> =
  createContext<IndicatorFrameValue | null>(null);

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
  const frame = use(IndicatorFrame);
  if (!frame) throw new Error('Pager.Indicator: render it as a child of Pager.Root.');
  const look = mapPagerIndicatorStyle(useTheme().theme);
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
          position={position}
          pageKeys={pageKeys}
          look={look}
          color={enabledPages[at] ? look.idle : look.disabled}
        />
      ))}
    </View>
  );
}

/** Page `page`'s dot: as much a pill in the shown ink as that page is the shown one. */
function Dot({
  page,
  position,
  pageKeys,
  look: { dot, dotWidth, pillWidth, shown },
  color,
}: {
  readonly page: string;
  readonly position: SharedValue<number>;
  readonly pageKeys: SharedValue<readonly string[]>;
  readonly look: PagerIndicatorStyle;
  readonly color: string;
}) {
  // The page's place is read from the UI thread's keys, so it moves with `position` when a page
  // is added or removed before it. Dependency arrays let a web build without the worklets Babel
  // plugin run this style.
  const motion = useAnimatedStyle(
    () => {
      const keys = pageKeys.value;
      const share = pageShare(position.value, keys.indexOf(page), keys.length);
      return {
        width: dotWidth + (pillWidth - dotWidth) * share,
        backgroundColor: interpolateColor(share, [0, 1], [color, shown]),
      };
    },
    WEB ? [position, pageKeys, page, dotWidth, pillWidth, color, shown] : undefined,
  );
  return <Animated.View style={[dot, motion]} />;
}
