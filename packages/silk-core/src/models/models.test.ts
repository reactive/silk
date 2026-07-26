import { expect, test } from '@rstest/core';
import {
  isFeedEntryNotification,
  isFeedEntryPost,
  type FeedEntryModel,
  type PostModel,
} from './index.js';

const samplePost: PostModel = {
  id: 'p1',
  author: {
    id: 'u1',
    name: 'Ada Lovelace',
    meta: '@ada',
    fallback: 'AL',
  },
  body: 'Analytical Engine notes',
  createdAt: '2026-07-26T12:00:00.000Z',
};

test('models are JSON-serializable', () => {
  const entry: FeedEntryModel = { type: 'post', value: samplePost };
  const roundTrip = JSON.parse(JSON.stringify(entry)) as FeedEntryModel;
  expect(roundTrip).toEqual(entry);
  expect(isFeedEntryPost(roundTrip)).toBe(true);
  expect(isFeedEntryNotification(roundTrip)).toBe(false);
});

test('feed entry guards narrow both branches', () => {
  const notification: FeedEntryModel = {
    type: 'notification',
    value: {
      id: 'n1',
      kind: 'mention',
      text: 'mentioned you',
      createdAt: '2026-07-26T12:00:00.000Z',
      read: false,
    },
  };
  expect(isFeedEntryNotification(notification)).toBe(true);
  if (isFeedEntryNotification(notification)) {
    expect(notification.value.kind).toBe('mention');
  }
});
