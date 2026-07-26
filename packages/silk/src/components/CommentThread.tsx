import { css, cx } from '@linaria/core';
import type { CommentModel } from '@reactive/silk-core';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { Button } from './Button';
import { Comment } from './Comment';
import { Stack } from './Stack';

/* Stack owns margin/padding; only the marker is left for the list to drop. */
const listClass: string = css`
  list-style: none;
`;

const listItemClass: string = css`
  list-style: none;
`;

const continueButtonClass: string = css`
  align-self: flex-start;
`;

export interface CommentThreadProps
  extends Omit<ComponentPropsWithoutRef<'ul'>, 'children'> {
  readonly comments: readonly CommentModel[];
  readonly maxDepth?: number;
  readonly depth?: number;
  readonly onContinue?: (comment: CommentModel) => void;
  readonly continueLabel?: ReactNode;
  readonly onAction?: (actionId: string, comment: CommentModel) => void;
  readonly ref?: Ref<HTMLUListElement>;
}

function CommentThreadItem({
  comment,
  depth,
  maxDepth,
  onContinue,
  continueLabel,
  onAction,
}: {
  readonly comment: CommentModel;
  readonly depth: number;
  readonly maxDepth: number;
  readonly onContinue?: (comment: CommentModel) => void;
  readonly continueLabel: ReactNode;
  readonly onAction?: (actionId: string, comment: CommentModel) => void;
}): JSX.Element {
  const canNest = depth < maxDepth;
  const loadedReplies = comment.replies ?? [];
  const hasInlineReplies = canNest && loadedReplies.length > 0;
  const needsContinue =
    comment.hasMoreReplies ||
    (!canNest && (comment.replyCount > 0 || loadedReplies.length > 0));

  const continueText =
    typeof continueLabel === 'string' && comment.replyCount > 0
      ? `${continueLabel} (${comment.replyCount})`
      : continueLabel;

  const continueButton =
    needsContinue && onContinue ? (
      <Button
        className={continueButtonClass}
        variant="ghost"
        tone="accent"
        size="sm"
        density="compact"
        onClick={() => {
          onContinue(comment);
        }}
      >
        {continueText}
        {typeof continueLabel !== 'string' && comment.replyCount > 0
          ? ` (${comment.replyCount})`
          : null}
      </Button>
    ) : null;

  // Replies nest inside the comment's own content column, so every level
  // indents by the media column and renders its own rail.
  const replies =
    hasInlineReplies || continueButton !== null ? (
      <>
        {hasInlineReplies ? (
          <CommentThread
            comments={loadedReplies}
            depth={depth + 1}
            maxDepth={maxDepth}
            {...(onContinue !== undefined ? { onContinue } : {})}
            continueLabel={continueLabel}
            {...(onAction !== undefined ? { onAction } : {})}
          />
        ) : null}
        {continueButton}
      </>
    ) : undefined;

  return (
    <li className={listItemClass}>
      <Comment
        model={comment}
        onAction={(actionId) => {
          onAction?.(actionId, comment);
        }}
        {...(replies !== undefined ? { replies } : {})}
      />
    </li>
  );
}

/**
 * Bounded recursive comment list. Recurses only to `maxDepth`; further
 * replies are exposed via `hasMoreReplies` / `replyCount` + `onContinue`.
 * Renderer utility — not a compound composite (see COMPOSITES.md).
 */
export function CommentThread({
  comments,
  maxDepth = 3,
  depth = 0,
  onContinue,
  continueLabel = 'Continue thread',
  onAction,
  className,
  ...props
}: CommentThreadProps): JSX.Element {
  return (
    <Stack asChild gap="3" align="stretch">
      <ul {...props} className={cx(listClass, className)}>
        {comments.map((comment) => (
          <CommentThreadItem
            key={comment.id}
            comment={comment}
            depth={depth}
            maxDepth={maxDepth}
            {...(onContinue !== undefined ? { onContinue } : {})}
            continueLabel={continueLabel}
            {...(onAction !== undefined ? { onAction } : {})}
          />
        ))}
      </ul>
    </Stack>
  );
}
