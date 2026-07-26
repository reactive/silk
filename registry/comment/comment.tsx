/**
 * Comment composite — synced from packages/silk/src/components/Comment.tsx
 * via scripts/sync-registry.mjs. Consumer-owned source; depends on @reactive/silk.
 */
import { css, cx } from '@linaria/core';
import {
  commentRecipe,
  mediaScale,
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
import { useComponentDefaults } from '@reactive/silk';
import { ActionBar } from '@reactive/silk';
import { Avatar } from '@reactive/silk';
import { formatTimestamp } from './formatTimestamp';
import { Inline } from '@reactive/silk';
import { MediaObject } from '@reactive/silk';
import { Stack } from '@reactive/silk';
import { Text } from '@reactive/silk';

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

export type CommentRepliesProps = ComponentPropsWithoutRef<'div'> & {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
};

/*
 * A reply block is a coarser boundary than the lines within one comment, so it
 * gets more room than the content column's own rhythm.
 */
const repliesClass: string = css`
  padding-block-start: var(--silk-space-1);
`;

/**
 * Replies live in the comment's content column, so nesting indents by the
 * media column on its own — no depth arithmetic, and the rail lands under the
 * byline it belongs to.
 */
function CommentReplies({
  className,
  children,
  ...props
}: CommentRepliesProps): JSX.Element {
  useCommentContext();
  return (
    <Stack
      gap="3"
      align="stretch"
      rail="start"
      className={cx(repliesClass, className)}
      {...props}
    >
      {children}
    </Stack>
  );
}

export interface CommentProps
  extends Omit<CommentRootProps, 'children'>, CommentVariantProps {
  readonly model: CommentModel;
  readonly timestampLabel?: ReactNode;
  readonly onAction?: (actionId: string) => void;
  /** Nested replies, rendered railed inside this comment's content column. */
  readonly replies?: ReactNode;
}

function CommentConvenience({
  model,
  timestampLabel,
  onAction,
  size,
  replies,
  ...props
}: CommentProps): JSX.Element {
  const defaults = useComponentDefaults('Comment');
  const resolvedSize = size ?? defaults.size ?? commentRecipe.defaults.size;
  const timeLabel = timestampLabel ?? formatTimestamp(model.createdAt, 'time');

  return (
    <CommentRoot {...props} size={resolvedSize}>
      <MediaObject
        size={resolvedSize}
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
          <Text role={mediaScale[resolvedSize].primaryRole} tone="primary">
            {model.author.name}
          </Text>
          {model.author.meta !== undefined ? (
            <Text role={mediaScale[resolvedSize].metaRole} tone="secondary">
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
        {replies !== undefined ? (
          <CommentReplies>{replies}</CommentReplies>
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
