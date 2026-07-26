import { Button, EmptyState } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Composite/EmptyState',
  component: EmptyState,
  args: {
    title: 'Nothing here',
    description: 'When content arrives, it will show up in this space.',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const WithAction: Story = {
  args: {
    action: <Button tone="accent">Create post</Button>,
  },
};
