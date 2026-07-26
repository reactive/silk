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

  const countSuffix =
    comment.replyCount > 0 ? ` (${comment.replyCount})` : null;

  const continueButton =
    needsContinue && onContinue !== undefined ? (
      <Button
        variant="ghost"
        tone="accent"
        size="sm"
        density="compact"
        onClick={() => {
          onContinue(comment);
        }}
      >
        {continueLabel}
        {countSuffix}
      </Button>
    ) : undefined;

  // Replies nest inside the comment's own content column, so every level
  // indents by the media column and renders its own rail. The continue button
  // continues this comment's thread rather than being one of its replies, so it
  // goes to the footer slot, outside that rail.
  const replies = hasInlineReplies ? (
    <CommentThread
      comments={loadedReplies}
      depth={depth + 1}
      maxDepth={maxDepth}
      {...(onContinue !== undefined ? { onContinue } : {})}
      continueLabel={continueLabel}
      {...(onAction !== undefined ? { onAction } : {})}
    />
  ) : undefined;

  return (
    <li>
      <Comment
        model={comment}
        onAction={(actionId) => {
          onAction?.(actionId, comment);
        }}
        replies={replies}
        footer={continueButton}
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
