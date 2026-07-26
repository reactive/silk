import type { CommentModel } from '@reactive/silk-core';
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  JSX,
  ReactNode,
  Ref,
} from 'react';
import { Button } from './Button';
import { Comment } from './Comment';
import { Stack } from './Stack';

const listReset: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

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
  const showContinue =
    comment.hasMoreReplies ||
    (!canNest && (comment.replyCount > 0 || loadedReplies.length > 0));

  const continueText =
    typeof continueLabel === 'string' && comment.replyCount > 0
      ? `${continueLabel} (${comment.replyCount})`
      : continueLabel;

  return (
    <li style={listReset}>
      <Stack gap="2" align="stretch">
        <Comment
          model={comment}
          onAction={(actionId) => {
            onAction?.(actionId, comment);
          }}
        />
        {hasInlineReplies ? (
          <Stack
            gap="3"
            align="stretch"
            {...(depth === 0
              ? { rail: 'start' as const }
              : {
                  style: {
                    paddingInlineStart: 'var(--silk-space-3)',
                  },
                })}
          >
            <CommentThread
              comments={loadedReplies}
              depth={depth + 1}
              maxDepth={maxDepth}
              {...(onContinue !== undefined ? { onContinue } : {})}
              continueLabel={continueLabel}
              {...(onAction !== undefined ? { onAction } : {})}
            />
          </Stack>
        ) : null}
        {showContinue ? (
          <Button
            variant="ghost"
            tone="accent"
            size="sm"
            density="compact"
            onClick={() => {
              onContinue?.(comment);
            }}
            style={{ alignSelf: 'flex-start' }}
          >
            {continueText}
            {typeof continueLabel !== 'string' && comment.replyCount > 0
              ? ` (${comment.replyCount})`
              : null}
          </Button>
        ) : null}
      </Stack>
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
  style,
  ...props
}: CommentThreadProps): JSX.Element {
  return (
    <Stack asChild gap="3" align="stretch">
      <ul {...props} style={{ ...listReset, ...style }}>
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
