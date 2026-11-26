import { type Context, createContext, type ComponentRef, type JSX, type Ref, use } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { mapPagerIndicatorStyle } from '../../styles/mappers/pager.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import { WEB } from '../../web/host.js';
import { indicatorWeight } from './pagerPhysics.js';

export interface PagerIndicatorProps extends Omit<ViewProps, 'children'> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
}

/** What `Pager.Root` tells its indicator: where its pages stand, and which they are. */
interface IndicatorFrameValue {
  readonly position: SharedValue<number>;
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
  const { position, keys, enabledPages } = frame;
  return (
    <View
      {...rest}
      pointerEvents="none"
      aria-hidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[look.row, style]}
    >
      {keys.map((key, at) => (
        <Dot
          key={key}
          at={at}
          count={keys.length}
          position={position}
          dot={look.dot}
          pill={look.pill}
          radius={look.radius}
          color={enabledPages[at] ? look.idle : look.disabled}
          shown={look.shown}
        />
      ))}
    </View>
  );
}

/** One page's dot: as much a pill in the shown ink as its page is the shown one (`indicatorWeight`). */
function Dot({
  at,
  count,
  position,
  dot,
  pill,
  radius,
  color,
  shown,
}: {
  readonly at: number;
  readonly count: number;
  readonly position: SharedValue<number>;
  readonly dot: number;
  readonly pill: number;
  readonly radius: number;
  readonly color: string;
  readonly shown: string;
}) {
  // Dependency arrays let a web build without the worklets Babel plugin run these styles.
  const width = useAnimatedStyle(
    () => ({ width: dot + (pill - dot) * indicatorWeight(position.value, at, count) }),
    WEB ? [position, at, count, dot, pill] : undefined,
  );
  // The shown ink lies over the dot's own, as strong as the dot is the shown page's.
  const ink = useAnimatedStyle(
    () => ({ opacity: indicatorWeight(position.value, at, count) }),
    WEB ? [position, at, count] : undefined,
  );
  return (
    <Animated.View
      style={[{ height: dot, borderRadius: radius, backgroundColor: color }, styles.dot, width]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: shown }, ink]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dot: { overflow: 'hidden' },
});
