import {
  commentRecipe,
  type CommentModel,
  type CommentVariantProps,
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
import { ActionBar } from './ActionBar';
import { Avatar } from './Avatar';
import { formatTimestamp } from './formatTimestamp';
import { Inline } from './Inline';
import { MediaObject } from './MediaObject';
import { Stack } from './Stack';
import { Text } from './Text';

interface CommentContextValue {
  readonly size: NonNullable<CommentVariantProps['size']>;
}

const CommentContext = createContext<CommentContextValue | null>(null);

function useCommentContext(): CommentContextValue {
  const ctx = useContext(CommentContext);
  if (!ctx) {
    throw new Error('Comment compound parts must be used within Comment.Root');
  }
  return ctx;
}

export interface CommentRootProps
  extends ComponentPropsWithoutRef<'article'>, CommentVariantProps {
  readonly ref?: Ref<HTMLElement>;
  readonly children?: ReactNode;
}

function CommentRoot({
  size,
  className,
  children,
  ...props
}: CommentRootProps): JSX.Element {
  const defaults = useComponentDefaults('Comment');
  const resolvedSize = size ?? defaults.size ?? commentRecipe.defaults.size;

  return (
    <CommentContext.Provider value={{ size: resolvedSize }}>
      <Stack
        asChild
        gap="1"
        align="stretch"
        className={className}
        data-size={resolvedSize}
      >
        <article {...props}>{children}</article>
      </Stack>
    </CommentContext.Provider>
  );
}

export type CommentHeaderProps = ComponentPropsWithoutRef<'header'> & {
  readonly ref?: Ref<HTMLElement>;
  readonly children?: ReactNode;
};

function CommentHeader({
  children,
  ...props
}: CommentHeaderProps): JSX.Element {
  useCommentContext();
  return (
    <Inline asChild gap="2" align="baseline" wrap="wrap">
      <header {...props}>{children}</header>
    </Inline>
  );
}

export type CommentBodyProps = ComponentPropsWithoutRef<'div'> & {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
};

function CommentBody(props: CommentBodyProps): JSX.Element {
  useCommentContext();
  return <div {...props} />;
}

export type CommentActionsProps = ComponentPropsWithoutRef<'div'> & {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
};

function CommentActions(props: CommentActionsProps): JSX.Element {
  useCommentContext();
  return <div {...props} />;
}

export interface CommentProps
  extends Omit<CommentRootProps, 'children'>, CommentVariantProps {
  readonly model: CommentModel;
  readonly timestampLabel?: ReactNode;
  readonly onAction?: (actionId: string) => void;
}

function CommentConvenience({
  model,
  timestampLabel,
  onAction,
  size,
  ...props
}: CommentProps): JSX.Element {
  const defaults = useComponentDefaults('Comment');
  const resolvedSize = size ?? defaults.size ?? commentRecipe.defaults.size;
  const timeLabel = timestampLabel ?? formatTimestamp(model.createdAt, 'time');

  return (
    <CommentRoot {...props} size={resolvedSize}>
      <MediaObject
        gap="2"
        align="start"
        media={
          <Avatar
            size={resolvedSize}
            {...(model.author.avatar !== undefined
              ? {
                  src: model.author.avatar.src,
                  alt: model.author.avatar.alt,
                }
              : {})}
            {...(model.author.fallback !== undefined
              ? { fallback: model.author.fallback }
              : {})}
          />
        }
      >
        <CommentHeader>
          <Text role="label" tone="primary">
            {model.author.name}
          </Text>
          {model.author.meta !== undefined ? (
            <Text role="caption" tone="secondary">
              {model.author.meta}
            </Text>
          ) : null}
          <Text role="caption" tone="secondary" aria-hidden="true">
            ·
          </Text>
          <Text asChild role="caption" tone="secondary">
            <time dateTime={model.createdAt}>{timeLabel}</time>
          </Text>
        </CommentHeader>
        <CommentBody>
          <Text role="body">{model.body}</Text>
        </CommentBody>
        {model.actions !== undefined && model.actions.length > 0 ? (
          <CommentActions>
            <ActionBar.Root aria-label="Comment actions" density="compact">
              {model.actions.map((action) => (
                <ActionBar.Descriptor
                  key={action.id}
                  action={action}
                  variant="ghost"
                  {...(onAction !== undefined ? { onAction } : {})}
                />
              ))}
            </ActionBar.Root>
          </CommentActions>
        ) : null}
      </MediaObject>
    </CommentRoot>
  );
}

export interface CommentComponent {
  (props: CommentProps): JSX.Element;
  Root: typeof CommentRoot;
  Header: typeof CommentHeader;
  Body: typeof CommentBody;
  Actions: typeof CommentActions;
}

export const Comment: CommentComponent = Object.assign(CommentConvenience, {
  Root: CommentRoot,
  Header: CommentHeader,
  Body: CommentBody,
  Actions: CommentActions,
});
