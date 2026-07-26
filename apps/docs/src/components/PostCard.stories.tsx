import { PostCard } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Composite/PostCard',
  component: PostCard,
  args: {
    model: {
      id: 'p1',
      author: {
        id: 'u1',
        name: 'Ada Lovelace',
        meta: '@ada',
        fallback: 'AL',
      },
      body: 'The Analytical Engine weaves algebraic patterns.',
      createdAt: '2026-07-26T10:00:00.000Z',
      stats: [
        {
          id: 'likes',
          label: 'Likes',
          value: 128,
          delta: { value: 12, direction: 'up' as const },
        },
      ],
      actions: [
        { id: 'like', label: 'Like' },
        { id: 'reply', label: 'Reply' },
      ],
    },
  },
} satisfies Meta<typeof PostCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const WithLink: Story = { args: { href: '#post-p1' } };
