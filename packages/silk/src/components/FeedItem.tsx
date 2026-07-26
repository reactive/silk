import {
  isFeedEntryNotification,
  isFeedEntryPost,
  type FeedEntryModel,
} from '@reactive/silk-core';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { Box } from './Box';
import { Inline } from './Inline';
import { Notification } from './Notification';
import { PostCard } from './PostCard';
import { Skeleton } from './Skeleton';
import { Stack } from './Stack';

export interface FeedItemProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  readonly entry?: FeedEntryModel;
  readonly loading?: boolean;
  readonly onAction?: (actionId: string) => void;
  readonly ref?: Ref<HTMLDivElement>;
}

function FeedItemLoading(): JSX.Element {
  return (
    <PostCard.Root aria-busy="true" aria-label="Loading feed item">
      <PostCard.Header>
        <Inline gap="3" align="center">
          <Skeleton shape="circle" />
          <Stack gap="2" align="start">
            <Box style={{ width: '8rem' }}>
              <Skeleton shape="text" />
            </Box>
            <Box style={{ width: '5rem' }}>
              <Skeleton shape="text" />
            </Box>
          </Stack>
        </Inline>
      </PostCard.Header>
      <PostCard.Body>
        <Stack gap="2" align="stretch">
          <Skeleton shape="text" />
          <Skeleton shape="text" />
          <Box style={{ width: '70%' }}>
            <Skeleton shape="text" />
          </Box>
        </Stack>
      </PostCard.Body>
      <PostCard.Footer>
        <Inline gap="2">
          <Box style={{ width: '4rem' }}>
            <Skeleton shape="text" />
          </Box>
          <Box style={{ width: '4rem' }}>
            <Skeleton shape="text" />
          </Box>
        </Inline>
      </PostCard.Footer>
    </PostCard.Root>
  );
}

/**
 * Discriminated renderer over `FeedEntryModel`. Loading form uses PostCard
 * compound parts + Skeleton so the feed fixture stays composite-assembled.
 */
export function FeedItem({
  entry,
  loading = false,
  onAction,
  ...props
}: FeedItemProps): JSX.Element {
  let content: ReactNode;
  if (loading || entry === undefined) {
    content = <FeedItemLoading />;
  } else if (isFeedEntryPost(entry)) {
    content = (
      <PostCard
        model={entry.value}
        {...(onAction !== undefined ? { onAction } : {})}
      />
    );
  } else if (isFeedEntryNotification(entry)) {
    content = <Notification model={entry.value} />;
  } else {
    content = null;
  }

  return <div {...props}>{content}</div>;
}
