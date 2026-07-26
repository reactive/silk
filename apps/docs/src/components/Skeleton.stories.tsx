import { Skeleton, skeletonRecipe, Stack } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  args: { ...skeletonRecipe.defaults },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Shapes: Story = {
  render: () => (
    <Stack gap="3">
      <Skeleton shape="text" />
      <Skeleton shape="rect" />
      <Skeleton shape="circle" />
    </Stack>
  ),
};
