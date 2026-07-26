import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../test/a11y';
import { CommentThread } from './CommentThread';

const comments = [
  {
    id: 'c1',
    author: { id: 'u1', name: 'Ada', fallback: 'A' },
    body: 'Root',
    createdAt: '2026-07-26T10:00:00.000Z',
    replyCount: 2,
    hasMoreReplies: false,
    replies: [
      {
        id: 'c2',
        author: { id: 'u2', name: 'Charles', fallback: 'C' },
        body: 'Child',
        createdAt: '2026-07-26T11:00:00.000Z',
        replyCount: 1,
        hasMoreReplies: true,
        replies: [
          {
            id: 'c3',
            author: { id: 'u1', name: 'Ada', fallback: 'A' },
            body: 'Grandchild',
            createdAt: '2026-07-26T12:00:00.000Z',
            replyCount: 0,
            hasMoreReplies: false,
          },
        ],
      },
    ],
  },
] as const;

test('CommentThread respects maxDepth and continue affordance', async () => {
  const user = userEvent.setup();
  let continued = '';
  render(
    <CommentThread
      comments={comments}
      maxDepth={1}
      onContinue={(c) => {
        continued = c.id;
      }}
    />,
  );
  expect(screen.getByText('Root')).toBeTruthy();
  expect(screen.getByText('Child')).toBeTruthy();
  expect(screen.queryByText('Grandchild')).toBeNull();
  await user.click(screen.getByRole('button', { name: /Continue thread/i }));
  expect(continued).toBe('c2');
});

test('CommentThread shows continue when hasMoreReplies with loaded replies', () => {
  render(
    <CommentThread
      comments={[
        {
          id: 'c1',
          author: { id: 'u1', name: 'Ada', fallback: 'A' },
          body: 'Root',
          createdAt: '2026-07-26T10:00:00.000Z',
          replyCount: 5,
          hasMoreReplies: true,
          replies: [
            {
              id: 'c2',
              author: { id: 'u2', name: 'Charles', fallback: 'C' },
              body: 'Loaded reply',
              createdAt: '2026-07-26T11:00:00.000Z',
              replyCount: 0,
              hasMoreReplies: false,
            },
          ],
        },
      ]}
      maxDepth={3}
      onContinue={() => {}}
    />,
  );
  expect(screen.getByText('Loaded reply')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Continue thread/i })).toBeTruthy();
});

test('CommentThread hides continue without onContinue', () => {
  render(
    <CommentThread
      comments={[
        {
          id: 'c1',
          author: { id: 'u1', name: 'Ada', fallback: 'A' },
          body: 'Root',
          createdAt: '2026-07-26T10:00:00.000Z',
          replyCount: 5,
          hasMoreReplies: true,
          replies: [
            {
              id: 'c2',
              author: { id: 'u2', name: 'Charles', fallback: 'C' },
              body: 'Loaded reply',
              createdAt: '2026-07-26T11:00:00.000Z',
              replyCount: 0,
              hasMoreReplies: false,
            },
          ],
        },
      ]}
      maxDepth={1}
    />,
  );
  expect(screen.getByText('Loaded reply')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Continue thread/i })).toBeNull();
});

test('CommentThread has no axe violations', async () => {
  const { container } = render(
    <CommentThread comments={comments} maxDepth={2} />,
  );
  await expectNoAxeViolations(container);
});
