import { CommentThread } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Composite/CommentThread',
  component: CommentThread,
  args: {
    maxDepth: 3,
    comments: [
      {
        id: 'c1',
        author: {
          id: 'u1',
          name: 'Ada Lovelace',
          meta: '@ada',
          fallback: 'AL',
        },
        body: 'The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves.',
        createdAt: '2026-07-26T10:00:00.000Z',
        replyCount: 2,
        hasMoreReplies: false,
        actions: [
          { id: 'like', label: 'Like' },
          { id: 'reply', label: 'Reply' },
        ],
        replies: [
          {
            id: 'c2',
            author: {
              id: 'u2',
              name: 'Charles Babbage',
              meta: '@charles',
              fallback: 'CB',
            },
            body: 'A useful analogy — though the carry chain is where the metaphor frays.',
            createdAt: '2026-07-26T11:00:00.000Z',
            replyCount: 1,
            hasMoreReplies: false,
            actions: [
              { id: 'like', label: 'Like' },
              { id: 'reply', label: 'Reply' },
            ],
            replies: [
              {
                id: 'c3',
                author: {
                  id: 'u1',
                  name: 'Ada Lovelace',
                  meta: '@ada',
                  fallback: 'AL',
                },
                body: 'Agreed. Keep the rail light and the byline on one line.',
                createdAt: '2026-07-26T12:00:00.000Z',
                replyCount: 0,
                hasMoreReplies: false,
                actions: [{ id: 'reply', label: 'Reply' }],
              },
            ],
          },
        ],
      },
    ],
  },
} satisfies Meta<typeof CommentThread>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
