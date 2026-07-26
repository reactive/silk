import {
  emptyStateRecipe,
  type EmptyStateVariantProps,
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
import { Heading } from './Heading';
import { Stack } from './Stack';
import { Text } from './Text';

interface EmptyStateContextValue {
  readonly size: NonNullable<EmptyStateVariantProps['size']>;
}

const EmptyStateContext = createContext<EmptyStateContextValue | null>(null);

function useEmptyStateContext(): EmptyStateContextValue {
  const ctx = useContext(EmptyStateContext);
  if (!ctx) {
    throw new Error(
      'EmptyState compound parts must be used within EmptyState.Root',
    );
  }
  return ctx;
}

const gapBySize = { sm: '2', md: '3', lg: '4' } as const;
const headingBySize = { sm: 'sm', md: 'md', lg: 'lg' } as const;

export interface EmptyStateRootProps
  extends ComponentPropsWithoutRef<'div'>, EmptyStateVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

function EmptyStateRoot({
  size,
  asChild = false,
  className,
  children,
  ...props
}: EmptyStateRootProps): JSX.Element {
  const defaults = useComponentDefaults('EmptyState');
  const resolvedSize = size ?? defaults.size ?? emptyStateRecipe.defaults.size;

  return (
    <EmptyStateContext.Provider value={{ size: resolvedSize }}>
      <Stack
        {...props}
        asChild={asChild}
        gap={gapBySize[resolvedSize]}
        align="center"
        justify="center"
        className={className}
        data-size={resolvedSize}
      >
        {children}
      </Stack>
    </EmptyStateContext.Provider>
  );
}

export type EmptyStateMediaProps = ComponentPropsWithoutRef<'div'> & {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
};

function EmptyStateMedia(props: EmptyStateMediaProps): JSX.Element {
  useEmptyStateContext();
  return <div {...props} />;
}

export type EmptyStateTitleProps = ComponentPropsWithoutRef<'h2'> & {
  readonly ref?: Ref<HTMLHeadingElement>;
  readonly children?: ReactNode;
};

function EmptyStateTitle({
  children,
  className,
  ...props
}: EmptyStateTitleProps): JSX.Element {
  const { size } = useEmptyStateContext();
  return (
    <Heading
      level="2"
      size={headingBySize[size]}
      className={className}
      {...props}
    >
      {children}
    </Heading>
  );
}

export type EmptyStateDescriptionProps = ComponentPropsWithoutRef<'p'> & {
  readonly ref?: Ref<HTMLParagraphElement>;
  readonly children?: ReactNode;
};

function EmptyStateDescription({
  className,
  children,
  ...props
}: EmptyStateDescriptionProps): JSX.Element {
  useEmptyStateContext();
  return (
    <Text asChild role="body" tone="secondary" className={className}>
      <p {...props}>{children}</p>
    </Text>
  );
}

export type EmptyStateActionProps = ComponentPropsWithoutRef<'div'> & {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
};

function EmptyStateAction(props: EmptyStateActionProps): JSX.Element {
  useEmptyStateContext();
  return <div {...props} />;
}

export interface EmptyStateProps
  extends Omit<EmptyStateRootProps, 'children' | 'title'>,
    EmptyStateVariantProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly media?: ReactNode;
  readonly action?: ReactNode;
}

function EmptyStateConvenience({
  title,
  description,
  media,
  action,
  ...props
}: EmptyStateProps): JSX.Element {
  return (
    <EmptyStateRoot {...props}>
      {media !== undefined ? <EmptyStateMedia>{media}</EmptyStateMedia> : null}
      <EmptyStateTitle>{title}</EmptyStateTitle>
      {description !== undefined ? (
        <EmptyStateDescription>{description}</EmptyStateDescription>
      ) : null}
      {action !== undefined ? (
        <EmptyStateAction>{action}</EmptyStateAction>
      ) : null}
    </EmptyStateRoot>
  );
}

export interface EmptyStateComponent {
  (props: EmptyStateProps): JSX.Element;
  Root: typeof EmptyStateRoot;
  Media: typeof EmptyStateMedia;
  Title: typeof EmptyStateTitle;
  Description: typeof EmptyStateDescription;
  Action: typeof EmptyStateAction;
}

export const EmptyState: EmptyStateComponent = Object.assign(
  EmptyStateConvenience,
  {
    Root: EmptyStateRoot,
    Media: EmptyStateMedia,
    Title: EmptyStateTitle,
    Description: EmptyStateDescription,
    Action: EmptyStateAction,
  },
);
