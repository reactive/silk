import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../test/a11y';
import { FeedItem } from './FeedItem';

test('FeedItem renders post entries', () => {
  render(
    <FeedItem
      entry={{
        type: 'post',
        value: {
          id: 'p1',
          author: { id: 'u1', name: 'Ada', fallback: 'A' },
          body: 'Post body',
          createdAt: '2026-07-26T10:00:00.000Z',
        },
      }}
    />,
  );
  expect(screen.getByText('Post body')).toBeTruthy();
});

test('FeedItem loading uses busy PostCard skeleton', () => {
  render(<FeedItem loading />);
  expect(screen.getByLabelText('Loading feed item')).toBeTruthy();
  expect(
    screen.getByLabelText('Loading feed item').getAttribute('aria-busy'),
  ).toBe('true');
});

test('FeedItem has no axe violations', async () => {
  const { container } = render(
    <FeedItem
      entry={{
        type: 'notification',
        value: {
          id: 'n1',
          kind: 'follow',
          text: 'followed you',
          createdAt: '2026-07-26T10:00:00.000Z',
          read: true,
        },
      }}
    />,
  );
  await expectNoAxeViolations(container);
});
