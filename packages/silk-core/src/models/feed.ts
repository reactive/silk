import type { NotificationModel } from './notification.js';
import type { PostModel } from './post.js';

export type FeedEntryModel =
  | { readonly type: 'post'; readonly value: PostModel }
  | { readonly type: 'notification'; readonly value: NotificationModel };

export function isFeedEntryPost(
  entry: FeedEntryModel,
): entry is Extract<FeedEntryModel, { type: 'post' }> {
  return entry.type === 'post';
}

export function isFeedEntryNotification(
  entry: FeedEntryModel,
): entry is Extract<FeedEntryModel, { type: 'notification' }> {
  return entry.type === 'notification';
}
