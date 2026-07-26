import {
  statGroupRecipe,
  type StatGroupVariantProps,
  type StatModel,
} from '@reactive/silk-core';
import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { Inline } from './Inline';
import { Stack } from './Stack';
import { Text } from './Text';

interface StatGroupContextValue {
  readonly size: NonNullable<StatGroupVariantProps['size']>;
  readonly orientation: NonNullable<StatGroupVariantProps['orientation']>;
}

const StatGroupContext = createContext<StatGroupContextValue | null>(null);

function useStatGroupContext(): StatGroupContextValue {
  const ctx = useContext(StatGroupContext);
  if (!ctx) {
    throw new Error(
      'StatGroup compound parts must be used within StatGroup.Root',
    );
  }
  return ctx;
}

const valueRoleBySize = {
  sm: 'headingSm',
  md: 'heading',
  lg: 'headingLg',
} as const;

/**
 * Label and value sit flush (line-height only), so the gap between stats has
 * to carry the grouping on its own — and it grows with the value it separates.
 */
const gapBySize = { sm: '4', md: '6', lg: '7' } as const;

export interface StatGroupRootProps
  extends ComponentPropsWithoutRef<'dl'>, StatGroupVariantProps {
  readonly ref?: Ref<HTMLDListElement>;
  readonly children?: ReactNode;
}

function StatGroupRoot({
  size,
  orientation,
  className,
  children,
  ...props
}: StatGroupRootProps): JSX.Element {
  const defaults = useComponentDefaults('StatGroup');
  const resolvedSize = size ?? defaults.size ?? statGroupRecipe.defaults.size;
  const resolvedOrientation =
    orientation ??
    defaults.orientation ??
    statGroupRecipe.defaults.orientation;

  const Layout = resolvedOrientation === 'vertical' ? Stack : Inline;

  return (
    <StatGroupContext.Provider
      value={{ size: resolvedSize, orientation: resolvedOrientation }}
    >
      <Layout
        asChild
        gap={gapBySize[resolvedSize]}
        align={resolvedOrientation === 'vertical' ? 'stretch' : 'start'}
        {...(resolvedOrientation === 'horizontal'
          ? { wrap: 'wrap' as const }
          : {})}
        className={className}
        data-size={resolvedSize}
        data-orientation={resolvedOrientation}
      >
        <dl {...props}>{children}</dl>
      </Layout>
    </StatGroupContext.Provider>
  );
}

export type StatGroupStatProps = ComponentPropsWithoutRef<'div'> & {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
};

function StatGroupStat({ children, ...props }: StatGroupStatProps): JSX.Element {
  useStatGroupContext();
  return <div {...props}>{children}</div>;
}

export type StatGroupLabelProps = ComponentPropsWithoutRef<'dt'> & {
  readonly ref?: Ref<HTMLElement>;
  readonly children?: ReactNode;
};

function StatGroupLabel({
  children,
  className,
  ...props
}: StatGroupLabelProps): JSX.Element {
  useStatGroupContext();
  return (
    <Text asChild role="caption" tone="secondary" className={className}>
      <dt {...props}>{children}</dt>
    </Text>
  );
}

export type StatGroupValueProps = ComponentPropsWithoutRef<'dd'> & {
  readonly ref?: Ref<HTMLElement>;
  readonly children?: ReactNode;
};

function StatGroupValue({
  children,
  className,
  ...props
}: StatGroupValueProps): JSX.Element {
  const { size } = useStatGroupContext();
  return (
    <Text asChild role={valueRoleBySize[size]} tone="primary" className={className}>
      <dd {...props}>{children}</dd>
    </Text>
  );
}

export type StatGroupDeltaProps = ComponentPropsWithoutRef<'span'> & {
  readonly direction: 'up' | 'down';
  readonly ref?: Ref<HTMLSpanElement>;
  readonly children?: ReactNode;
};

function StatGroupDelta({
  direction,
  children,
  ...props
}: StatGroupDeltaProps): JSX.Element {
  useStatGroupContext();
  const tone = direction === 'up' ? 'success' : 'danger';
  const label = direction === 'up' ? 'up' : 'down';
  return (
    <Text asChild role="caption" tone={tone}>
      <span {...props} aria-label={`${label} ${String(children)}`}>
        <span aria-hidden="true">{direction === 'up' ? '▲' : '▼'} </span>
        {children}
      </span>
    </Text>
  );
}

export interface StatGroupProps
  extends Omit<StatGroupRootProps, 'children'>, StatGroupVariantProps {
  readonly stats: readonly StatModel[];
}

function StatGroupConvenience({
  stats,
  ...props
}: StatGroupProps): JSX.Element {
  return (
    <StatGroupRoot {...props}>
      {stats.map((stat) => (
        <StatGroupStat key={stat.id}>
          <StatGroupLabel>{stat.label}</StatGroupLabel>
          <StatGroupValue>
            {stat.value}
            {stat.delta !== undefined ? (
              <>
                {' '}
                <StatGroupDelta direction={stat.delta.direction}>
                  {stat.delta.value}
                </StatGroupDelta>
              </>
            ) : null}
          </StatGroupValue>
        </StatGroupStat>
      ))}
    </StatGroupRoot>
  );
}

export interface StatGroupComponent {
  (props: StatGroupProps): JSX.Element;
  Root: typeof StatGroupRoot;
  Stat: typeof StatGroupStat;
  Label: typeof StatGroupLabel;
  Value: typeof StatGroupValue;
  Delta: typeof StatGroupDelta;
}

export const StatGroup: StatGroupComponent = Object.assign(StatGroupConvenience, {
  Root: StatGroupRoot,
  Stat: StatGroupStat,
  Label: StatGroupLabel,
  Value: StatGroupValue,
  Delta: StatGroupDelta,
});
