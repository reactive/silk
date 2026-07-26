import { FeedItem, Stack } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Composite/FeedItem',
  component: FeedItem,
} satisfies Meta<typeof FeedItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Post: Story = {
  args: {
    entry: {
      type: 'post',
      value: {
        id: 'p1',
        author: { id: 'u1', name: 'Ada', fallback: 'A' },
        body: 'A feed post',
        createdAt: '2026-07-26T10:00:00.000Z',
      },
    },
  },
};

export const Loading: Story = {
  render: () => (
    <Stack gap="4">
      <FeedItem loading />
      <FeedItem loading />
    </Stack>
  ),
};
