import { StatGroup } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Composite/StatGroup',
  component: StatGroup,
  args: {
    stats: [
      {
        id: 'likes',
        label: 'Likes',
        value: 128,
        delta: { value: 12, direction: 'up' as const },
      },
      { id: 'replies', label: 'Replies', value: 14 },
    ],
  },
} satisfies Meta<typeof StatGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Vertical: Story = { args: { orientation: 'vertical' } };
